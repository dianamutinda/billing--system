const express = require('express');
const router = express.Router();
const { getTransactionByToken } = require('../services/paymentService');
const { getActiveSessionByToken } = require('../services/sessionService');

router.post('/status', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid token.' });
    }

    const activeSession = await getActiveSessionByToken(token);
    if (activeSession) {
      return res.json({ status: 'active', expiresAt: activeSession.expires_at });
    }

    const transaction = await getTransactionByToken(token);
    if (!transaction) {
      return res.json({ status: 'not_found' });
    }

    res.json({ status: transaction.status }); // 'pending' or 'failed'
  } catch (err) {
    console.error('POST /api/sessions/status failed:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;