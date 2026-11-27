const { pool } = require('../db');
const { decrypt } = require('./crypto');
const { getPackageById } = require('./packageService');
const { activate } = require('../services/networkService');

const DARAJA_BASE = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  live: 'https://api.safaricom.co.ke',
};

// In-memory cache: `${tenantId}:${env}` -> { token, expiresAt }
const tokenCache = new Map();

// Format current timestamp in East Africa Time (UTC+3) as YYYYMMDDHHmmss
function getEatTimestamp() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}${map.month}${map.day}${map.hour}${map.minute}${map.second}`;
}

// Normalize 07..., 01..., +254..., 254... into 254XXXXXXXXX
function normalizeKenyanPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  return null;
}

// Used by routes/sessions.js to answer "did my payment go through?"
async function getTransactionByToken(token) {
  const { rows } = await pool.query(
    `SELECT * FROM transactions
     WHERE token = $1
     ORDER BY created_at DESC
     LIMIT 1`,
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
  const env = t.daraja_env === 'live' ? 'live' : 'sandbox';
  return {
    tenantId,
    env,
    shortcode: t.daraja_shortcode,
    consumerKey: t.daraja_consumer_key,
    consumerSecret: decrypt(t.daraja_consumer_secret_encrypted),
    passkey: decrypt(t.daraja_passkey_encrypted),
    baseUrl: DARAJA_BASE[env],
  };
}

// Daraja wants a short-lived access token before any STK push (cached per tenant)
async function getAccessToken(cfg) {
  const cacheKey = `${cfg.tenantId}:${cfg.env}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const auth = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString('base64');
  const res = await fetch(
    `${cfg.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` }, signal: AbortSignal.timeout(15000) }
  );
  if (!res.ok) throw new Error(`Daraja auth failed (${res.status})`);
  const data = await res.json();

  const expiresInSec = Number(data.expires_in) || 3599;
  tokenCache.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + expiresInSec * 1000,
  });

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

async function initiateStkPush(rawPhone, packageId, token, tenantId) {
  const phone = normalizeKenyanPhone(rawPhone);

  // Any rejection is recorded as a failed row, then returned without a CheckoutRequestID
  const fail = async (reason) => {
    await saveTransaction({
      checkoutRequestId: null,
      phone: phone || String(rawPhone || ''),
      packageId,
      status: 'failed',
      resultDesc: reason,
      token,
      tenantId,
    });
    return {};
  };

  if (!phone) return fail('Invalid Kenyan phone number');

  // Guard against double-taps while an STK prompt is already pending for this token
  const existing = await pool.query(
    `SELECT checkout_request_id FROM transactions
     WHERE token = $1 AND tenant_id = $2 AND status = 'pending'
       AND created_at > NOW() - INTERVAL '90 seconds'
     ORDER BY created_at DESC LIMIT 1`,
    [token, tenantId]
  );
  if (existing.rows[0]) {
    return { CheckoutRequestID: existing.rows[0].checkout_request_id, alreadyPending: true };
  }

  // Ensure tenant is active and has not exceeded plan_expires_at
  const tenantRes = await pool.query(
    `SELECT status, plan_expires_at FROM tenants WHERE id = $1 LIMIT 1`,
    [tenantId]
  );
  const tenant = tenantRes.rows[0];
  if (!tenant || tenant.status === 'suspended') {
    return fail('Tenant account is unavailable');
  }
  if (tenant.plan_expires_at && new Date(tenant.plan_expires_at).getTime() <= Date.now()) {
    return fail('Tenant subscription has expired');
  }

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
    const timestamp = getEatTimestamp();
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
        AccountReference: `WiFi-${String(pkg.id).slice(0, 8)}`,
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
    checkoutRequestId: data.CheckoutRequestID,
    phone,
    packageId,
    status: 'pending',
    resultDesc: null,
    token,
    tenantId,
  });
  return data;
}

async function processStkCallback(cb) {
  if (!cb || !cb.CheckoutRequestID) {
    return null;
  }

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

    if (Number(ResultCode) !== 0) {
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

    if (!pkg || !Number.isFinite(paidAmount) || paidAmount !== Math.round(Number(pkg.amount))) {
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

    const addMs = pkg.duration_minutes * 60 * 1000;

    // Extend active session if this token/phone already has unexpired time; otherwise create new
    const activeSess = await client.query(
      `SELECT * FROM sessions
       WHERE tenant_id = $1 AND token = $2 AND expires_at > NOW()
       ORDER BY expires_at DESC LIMIT 1
       FOR UPDATE`,
      [tx.tenant_id, tx.token]
    );

    let sessionRow;
    if (activeSess.rows[0]) {
      const currentExpiry = new Date(activeSess.rows[0].expires_at).getTime();
      const extendedExpiry = new Date(currentExpiry + addMs);
      const updated = await client.query(
        `UPDATE sessions
         SET expires_at = $1, package_id = $2, package_name = $3
         WHERE id = $4
         RETURNING *`,
        [extendedExpiry, pkg.id, pkg.label, activeSess.rows[0].id]
      );
      sessionRow = updated.rows[0];
    } else {
      const expiresAt = new Date(Date.now() + addMs);
      const inserted = await client.query(
        `INSERT INTO sessions (phone_number, package_id, package_name, expires_at, token, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tx.phone, pkg.id, pkg.label, expiresAt, tx.token, tx.tenant_id]
      );
      sessionRow = inserted.rows[0];
    }

    await client.query('COMMIT');

    // Provision or update user on MikroTik after commit; activatePendingSessions retries if unreachable
    const activation = await activate({
      ...sessionRow,
      rate_limit: pkg.rate_limit || sessionRow.rate_limit || null,
      hotspot_profile: pkg.hotspot_profile || sessionRow.hotspot_profile || null,
      data_limit_bytes: pkg.data_limit_bytes || sessionRow.data_limit_bytes || null,
    });

    if (!activation.success) {
      console.error(
        `Router activation deferred for session ${sessionRow.id} (tenant ${tx.tenant_id}): ${activation.error}`
      );
    }

    return { status: 'paid', session: sessionRow, routerActivated: activation.success };
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

module.exports = {
  initiateStkPush,
  processStkCallback,
  getTransactionByToken,
  normalizeKenyanPhone,
};