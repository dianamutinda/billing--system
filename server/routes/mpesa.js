const express = require ('express');
const router = express.Router();
const {pendingTransactions} = require('../services/paymentService');

router.post('/callback', (req, res) => {
    console.log('Callback received:', JSON.stringify(req.body, null, 2));
    
    const callback = req.body.Body?.stkCallback;

    if (callback) {
        const { CheckoutRequestID, ResultCode, ResultDesc } = callback;
        const existing = pendingTransactions.get(CheckoutRequestID);

        if (existing) {
            pendingTransactions.set(CheckoutRequestID, {
                ...existing,
                status: ResultCode === 0 ? 'paid' : 'failed',
                resultDesc: ResultDesc,
            });
            console.log(`Transaction ${CheckoutRequestID} -> ${ResultCode === 0 ? 'PAID' : 'FAILED'}`);
            
        }
    }
     res.json({ResultCode:0, ResultDesc: 'Accepted'})
});
module.exports = router;