const { getPackageById } = require('./packageService')

const pendingTransactions = new Map();

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
    const pkg = getPackageById(packageId);
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
        pendingTransactions.set(data.CheckoutRequestID, {
            phone,
            packageId,
            status: 'pending',
        });
    }
    return data;
}


module.exports = { getAccessToken, initiateStkPush, pendingTransactions};