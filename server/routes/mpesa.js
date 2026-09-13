const express = require ('express');
const router = express.Router();
const { getTransaction, updateTransactionStatus } = require('../services/paymentService');
const { getPackageById } = require('../services/packageService');
const { createSession } = require('../services/sessionService');
const { activate } = require('../services/networkService');


router.post('/callback/:secret', async (req, res) => {
    if (req.params.secret !== process.env.MPESA_CALLBACK_SECRET) {
        return res.status(404).end();
    }
    try {
        console.log('Callback received:', JSON.stringify(req.body, null, 2));
        const callback = req.body.Body?.stkCallback;

        if (callback) {
            const { CheckoutRequestID, ResultCode, ResultDesc } = callback;
            const existing = await getTransaction(CheckoutRequestID);

            if (existing && existing.status === 'pending') {
                const paid = ResultCode === 0;
                const status = paid ? 'paid' : 'failed';
                await updateTransactionStatus(CheckoutRequestID, status, ResultDesc);

                if (paid) {
                    const pkg = await getPackageById(existing.package_id);
                    const session = await createSession(existing, pkg);
                    await activate(session);
                    console.log(`Session created for ${session.phone_number}, expires ${session.expires_at}`);
                }
            }
        }
        res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (err) {
        console.error('M-Pesa callback processing failed:', err);
        res.json({ ResultCode: 0, ResultDesc: 'Accepted' }); // still ACK to Safaricom
    }
});

module.exports = router;
