const express = require('express');
const router = express.Router();
const { getLatestTransactionByPhone } = require('../services/paymentService');
const { getActiveSessionByPhone } = require('../services/sessionService');

const PHONE_REGEX = /^254\d{9}$/;

router.get('/status', async (req, res) => {
    try {
        const { phone } = req.query;

        if (!phone || !PHONE_REGEX.test(phone)) {
            return res.status(400).json({ error: 'Invalid phone number.' });
        }

        const activeSession = await getActiveSessionByPhone(phone);
        if (activeSession) {
            return res.json({ status: 'active', expiresAt: activeSession.expires_at });
        }

        const transaction = await getLatestTransactionByPhone(phone);
        if (!transaction) {
            return res.json({ status: 'not_found' });
        }

        res.json({ status: transaction.status }); // 'pending' or 'failed'
    } catch (err) {
        console.error('GET /api/sessions/status failed:', err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

module.exports = router;