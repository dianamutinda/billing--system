const { pool, withTenant } = require('../db')

const { getPackageById } = require('./packageService')


function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return(
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) + 
    pad(now.getHours()) + 
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64')

  const response = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`
      },
    }
  );

  const data = await response.json();
  return data.access_token;
}

async function initiateStkPush(phone, packageId, token, tenantId) {
  const pkg = await getPackageById(packageId, tenantId);
  if (!pkg) throw new Error('Invalid package');

  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const password = Buffer.from(
    `${process.env.DARAJA_SHORTCODE}${process.env.DARAJA_PASSKEY}${timestamp}`
  ).toString('base64');

  const response = await fetch(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: process.env.DARAJA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: pkg.amount,
        PartyA: phone,
        PartyB: process.env.DARAJA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: `${process.env.NGROK_BASE_URL}/api/mpesa/callback/${process.env.MPESA_CALLBACK_SECRET}`,
        AccountReference: 'wifi-billing',
        TransactionDesc: `Payment for ${pkg.label}`,
      }),
    }
  );

  const data = await response.json();

  if (data.CheckoutRequestID) {
    await withTenant(tenantId, (client) =>
      client.query(
        `INSERT INTO transactions (checkout_request_id, phone, package_id, status, token, tenant_id)
         VALUES ($1, $2, $3, 'pending', $4, $5)`,
        [data.CheckoutRequestID, phone, packageId, token, tenantId]
      )
    );
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

module.exports = { 
  getAccessToken, 
  initiateStkPush, 
  getTransaction, 
  updateTransactionStatus,
  getLatestTransactionByPhone,
  getTransactionByToken,
};