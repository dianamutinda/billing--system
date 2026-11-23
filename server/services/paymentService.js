const { pool } = require('../db');
const { decrypt } = require('./crypto');
const { getPackageById } = require('./packageService');

const DARAJA_BASE = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  live: 'https://api.safaricom.co.ke',
};

// Used by routes/sessions.js to answer "did my payment go through?"
async function getTransactionByToken(token) {
  const { rows } = await pool.query(
    'SELECT * FROM transactions WHERE token = $1',
    [token]
  );
  return rows[0] || null;
}

// Returns null if the tenant hasn't finished payment settings
async function getDarajaConfig(tenantId) {
  const { rows } = await pool.query(
    `SELECT daraja_shortcode, daraja_consumer_key, daraja_env,
            daraja_consumer_secret_encrypted, daraja_passkey_encrypted
     FROM tenants WHERE id = $1`,
    [tenantId]
  );
  const t = rows[0];
  if (
    !t || !t.daraja_shortcode || !t.daraja_consumer_key ||
    !t.daraja_consumer_secret_encrypted || !t.daraja_passkey_encrypted
  ) {
    return null;
  }
  return {
    shortcode: t.daraja_shortcode,
    consumerKey: t.daraja_consumer_key,
    consumerSecret: decrypt(t.daraja_consumer_secret_encrypted),
    passkey: t.daraja_passkey_encrypted && decrypt(t.daraja_passkey_encrypted),
    baseUrl: DARAJA_BASE[t.daraja_env] || DARAJA_BASE.sandbox,
  };
}

// Daraja wants a short-lived access token before any STK push
async function getAccessToken(cfg) {
  const auth = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString('base64');
  const res = await fetch(
    `${cfg.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` }, signal: AbortSignal.timeout(15000) }
  );
  if (!res.ok) throw new Error(`Daraja auth failed (${res.status})`);
  const data = await res.json();
  return data.access_token;
}

async function saveTransaction({ checkoutRequestId, phone, packageId, status, resultDesc, token, tenantId }) {
  await pool.query(
    `INSERT INTO transactions
       (checkout_request_id, phone, package_id, status, result_desc, token, tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [checkoutRequestId, phone, packageId, status, resultDesc, token, tenantId]
  );
}

async function initiateStkPush(phone, packageId, token, tenantId) {
  // Any rejection is recorded as a failed row, then returned without a CheckoutRequestID
  const fail = async (reason) => {
    await saveTransaction({
      checkoutRequestId: null, phone, packageId, status: 'failed',
      resultDesc: reason, token, tenantId,
    });
    return {};
  };

  const cfg = await getDarajaConfig(tenantId);
  if (!cfg) return fail('Daraja is not configured');

  const { MPESA_CALLBACK_URL, MPESA_CALLBACK_SECRET } = process.env;
  if (!MPESA_CALLBACK_URL || !MPESA_CALLBACK_SECRET) {
    return fail('Callback URL is not configured');
  }
  const callbackUrl = `${MPESA_CALLBACK_URL.replace(/\/$/, '')}/${MPESA_CALLBACK_SECRET}`;

  const pkg = await getPackageById(packageId, tenantId);
  if (!pkg) return fail('Package not found');

  let data;
  try {
    const accessToken = await getAccessToken(cfg);
    const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    const password = Buffer.from(`${cfg.shortcode}${cfg.passkey}${timestamp}`).toString('base64');

    const res = await fetch(`${cfg.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: cfg.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(Number(pkg.amount)),
        PartyA: phone,
        PartyB: cfg.shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: 'WiFi',
        TransactionDesc: 'WiFi access',
      }),
      signal: AbortSignal.timeout(20000),
    });
    data = await res.json().catch(() => ({}));
  } catch (err) {
    console.error('STK push failed:', err.message);
    return fail('Could not reach the payment provider');
  }

  if (!data.CheckoutRequestID) {
    return fail(data.errorMessage || data.ResponseDescription || 'Payment provider rejected the request');
  }

  await saveTransaction({
    checkoutRequestId: data.CheckoutRequestID, phone, packageId,
    status: 'pending', resultDesc: null, token, tenantId,
  });
  return data;
}

async function processStkCallback(cb) {
  const { CheckoutRequestID, ResultCode, ResultDesc } = cb;
  const items = (cb.CallbackMetadata && cb.CallbackMetadata.Item) || [];
  const meta = Object.fromEntries(items.map((i) => [i.Name, i.Value]));
  const receipt = meta.MpesaReceiptNumber ? String(meta.MpesaReceiptNumber) : null;
  const paidAmount = Number(meta.Amount);

  const client = await pool.connect();
  let broken = false;

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
    try {
      await client.query('ROLLBACK');
    } catch {
      broken = true; // the connection itself died, so the rollback failed too
    }

    throw err; // always surface the original error
  } finally {
    client.release(broken); // true tells the pool to destroy a dead client
  }
}

module.exports = { initiateStkPush, processStkCallback, getTransactionByToken };