const { pool, withTenant } = require('../db');
const { getPackageById } = require('./packageService');
const { decrypt } = require('../services/crypto'); // CHANGE if your crypto.js lives elsewhere

const DARAJA_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  live: 'https://api.safaricom.co.ke',
};

function getTimestamp() {
  // Daraja expects Nairobi time. Kenya is UTC+3 all year (no daylight saving),
  // so shift the clock by 3 hours and read it with the UTC getters.
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    now.getUTCFullYear() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds())
  );
}

async function fetchWithTimeout(url, options = {}, ms = 15000) {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(ms) });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      const e = new Error(`Request to ${new URL(url).host} timed out after ${ms}ms`);
      e.code = 'TIMEOUT';
      throw e;
    }
    throw err;
  }
}

// Loads one tenant's Daraja settings (admin pool: tenants is not tenant-scoped).
// Secrets are decrypted in memory only and never logged.
async function getDarajaConfig(tenantId) {
  const r = await pool.query(
    `SELECT daraja_shortcode, daraja_consumer_key, daraja_consumer_secret_encrypted,
            daraja_passkey_encrypted, daraja_env
     FROM tenants WHERE id = $1`,
    [tenantId]
  );
  const t = r.rows[0];
  if (!t) throw new Error('Tenant not found');

  if (
    !t.daraja_shortcode ||
    !t.daraja_consumer_key ||
    !t.daraja_consumer_secret_encrypted ||
    !t.daraja_passkey_encrypted
  ) {
    throw new Error(`Daraja is not configured for tenant ${tenantId}`);
  }

  return {
    shortcode: t.daraja_shortcode,
    consumerKey: t.daraja_consumer_key,
    consumerSecret: decrypt(t.daraja_consumer_secret_encrypted),
    passkey: decrypt(t.daraja_passkey_encrypted),
    baseUrl: DARAJA_URLS[t.daraja_env] || DARAJA_URLS.sandbox,
  };
}

async function getAccessToken(config) {
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

  const response = await fetchWithTimeout(
    `${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );

  if (!response.ok) {
    throw new Error(`Daraja token request failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Daraja token response had no access_token');
  }

  return data.access_token;
}

async function markTransactionFailed(tenantId, txId, reason) {
  try {
    await withTenant(tenantId, (client) =>
      client.query(
        `UPDATE transactions SET status = 'failed', result_desc = $1
         WHERE id = $2 AND status = 'pending'`,
        [reason, txId]
      )
    );
  } catch (err) {
    console.error(`Could not mark transaction ${txId} failed:`, err);
  }
}

async function initiateStkPush(phone, packageId, token, tenantId) {
  const pkg = await getPackageById(packageId, tenantId);
  if (!pkg) throw new Error('Invalid package');

  // Load this tenant's Daraja settings first: a misconfigured tenant fails
  // here, before any transaction row exists.
  const config = await getDarajaConfig(tenantId);

  // Record the payment attempt BEFORE the customer can be charged
  const txId = await withTenant(tenantId, async (client) => {
    const r = await client.query(
      `INSERT INTO transactions (phone, package_id, status, token, tenant_id)
       VALUES ($1, $2, 'pending', $3, $4) RETURNING id`,
      [phone, packageId, token, tenantId]
    );
    return r.rows[0].id;
  });

  // 1) Token: nothing has been sent yet, so failing the row is safe
  let accessToken;
  try {
    accessToken = await getAccessToken(config);
  } catch (err) {
    await markTransactionFailed(tenantId, txId, `Token error: ${err.message}`);
    throw err;
  }

  // 2) The push itself
  const timestamp = getTimestamp();
  const password = Buffer.from(
    `${config.shortcode}${config.passkey}${timestamp}`
  ).toString('base64');

  let data;
  try {
    const response = await fetchWithTimeout(
      `${config.baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: config.shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: pkg.amount,
          PartyA: phone,
          PartyB: config.shortcode,
          PhoneNumber: phone,
          CallBackURL: `${process.env.NGROK_BASE_URL}/api/mpesa/callback/${process.env.MPESA_CALLBACK_SECRET}`,
          AccountReference: 'wifi-billing',
          TransactionDesc: `Payment for ${pkg.label}`,
        }),
      }
    );

    data = await response.json();
  } catch (err) {
    if (err.code === 'TIMEOUT') {
      // Outcome unknown: the customer may have a prompt. Leave the row pending.
      console.error(
        `CRITICAL: STK push timed out, outcome unknown. tx=${txId} phone=${phone} tenant=${tenantId}`
      );
      throw err;
    }
    await markTransactionFailed(tenantId, txId, `STK push error: ${err.message}`);
    throw err;
  }

  if (!data.CheckoutRequestID) {
    await markTransactionFailed(
      tenantId,
      txId,
      data.errorMessage || data.ResponseDescription || 'STK push rejected'
    );
    return data;
  }

  // Attach Daraja's CheckoutRequestID to the pending row
  try {
    await withTenant(tenantId, (client) =>
      client.query(
        `UPDATE transactions SET checkout_request_id = $1 WHERE id = $2`,
        [data.CheckoutRequestID, txId]
      )
    );
  } catch (err) {
    // The customer HAS a prompt now, so do not mark this failed
    console.error(
      `CRITICAL: STK sent but id not saved. tx=${txId} checkout=${data.CheckoutRequestID}`,
      err
    );
    throw err;
  }

  return data;
}

async function getTransactionByToken(token) {
  const result = await pool.query(
    'SELECT * FROM transactions WHERE token = $1',
    [token]
  );
  return result.rows[0];
}

async function getTransaction(checkoutRequestId) {
  const result = await pool.query(
    'SELECT * FROM transactions WHERE checkout_request_id = $1',
    [checkoutRequestId]
  );
  return result.rows[0];
}

async function updateTransactionStatus(checkoutRequestId, status, resultDesc, tenantId) {
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `UPDATE transactions SET status = $1, result_desc = $2
       WHERE checkout_request_id = $3 AND tenant_id = $4 RETURNING *`,
      [status, resultDesc, checkoutRequestId, tenantId]
    );
    return result.rows[0];
  });
}

async function getLatestTransactionByPhone(phone, tenantId) {
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `SELECT * FROM transactions WHERE phone = $1 AND tenant_id = $2 ORDER BY created_at DESC LIMIT 1`,
      [phone, tenantId]
    );
    return result.rows[0];
  });
}

async function processStkCallback(cb) {
  const { CheckoutRequestID, ResultCode, ResultDesc } = cb;
  const items = (cb.CallbackMetadata && cb.CallbackMetadata.Item) || [];
  const meta = Object.fromEntries(items.map((i) => [i.Name, i.Value]));
  const receipt = meta.MpesaReceiptNumber ? String(meta.MpesaReceiptNumber) : null;
  const paidAmount = Number(meta.Amount);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock this transaction row so two simultaneous retries can't both process it
    const found = await client.query(
      'SELECT * FROM transactions WHERE checkout_request_id = $1 FOR UPDATE',
      [CheckoutRequestID]
    );
    const tx = found.rows[0];
    if (!tx || tx.status !== 'pending') {
      await client.query('COMMIT');
      return null; // unknown or already handled: nothing to do
    }

    if (ResultCode !== 0) {
      await client.query(
        `UPDATE transactions SET status = 'failed', result_desc = $2 WHERE checkout_request_id = $1`,
        [CheckoutRequestID, ResultDesc]
      );
      await client.query('COMMIT');
      return { status: 'failed' };
    }

    const pk = await client.query(
      'SELECT * FROM packages WHERE id = $1 AND tenant_id = $2',
      [tx.package_id, tx.tenant_id]
    );
    const pkg = pk.rows[0];

    if (!pkg || paidAmount !== Number(pkg.amount)) {
      const reason = !pkg
        ? 'package missing'
        : `amount mismatch: paid ${paidAmount}, price ${pkg.amount}`;
      await client.query(
        `UPDATE transactions SET status = 'review', result_desc = $2, mpesa_receipt = $3
         WHERE checkout_request_id = $1`,
        [CheckoutRequestID, reason, receipt]
      );
      await client.query('COMMIT');
      console.error(`Payment needs review (tenant ${tx.tenant_id}): ${reason}`);
      return { status: 'review' };
    }

    await client.query(
      `UPDATE transactions SET status = 'paid', result_desc = $2, mpesa_receipt = $3
       WHERE checkout_request_id = $1`,
      [CheckoutRequestID, ResultDesc, receipt]
    );

    const expiresAt = new Date(Date.now() + pkg.duration_minutes * 60 * 1000);
    const sess = await client.query(
      `INSERT INTO sessions (phone_number, package_id, package_name, expires_at, token, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tx.phone, pkg.id, pkg.label, expiresAt, tx.token, tx.tenant_id]
    );

    await client.query('COMMIT');
    return { status: 'paid', session: sess.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getAccessToken,
  initiateStkPush,
  getTransaction,
  updateTransactionStatus,
  getLatestTransactionByPhone,
  getTransactionByToken,
  processStkCallback,
};