const pool = require('../db')

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

async function initiateStkPush(phone, packageId) {
    const pkg = await getPackageById(packageId);
    if (!pkg) throw new Error('Invalid package');

    const token = await getAccessToken();
    const timestamp = getTimestamp();
    const password = Buffer.from(
        `${process.env.DARAJA_SHORTCODE}${process.env.DARAJA_PASSKEY}${timestamp}`
    ).toString('base64');


    const response = await fetch(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type' : 'application/json',
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
                CallBackURL: process.env.CALLBACK_URL,
                AccountReference: 'wifi-billing',
                TransactionDesc: `Payment for ${pkg.label}`
            }),
        }
    );

    const data = await response.json();

    if (data.CheckoutRequestID) {
        await pool.query(
            `INSERT INTO transactions (checkout_request_id, phone, package_id, status)
             VALUES ($1, $2, $3, 'pending')`,
             [data.CheckoutRequestID, phone, packageId]
        );
    }
    console.log('Package being charged:', pkg);
console.log('Amount being sent:', pkg.amount);
    return data;
}

async function getTransaction(checkoutRequestId) {
    const result = await pool.query(
        'SELECT * FROM transactions WHERE checkout_request_id = $1',
        [checkoutRequestId]
    );
    return result.rows[0];
}

async function updateTransactionStatus(checkoutRequestId, status, resultDesc) {
    const result = await pool.query(
        `UPDATE transactions SET status = $1, result_desc = $2
        WHERE checkout_request_id = $3 RETURNING *`,
        [status, resultDesc, checkoutRequestId]
    );
    return result.rows[0];
}


module.exports = { 
    getAccessToken, 
    initiateStkPush, 
    getTransaction, 
    updateTransactionStatus};