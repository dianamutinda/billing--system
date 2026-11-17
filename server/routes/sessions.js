const express = require('express');
const router = express.Router();
const { getTransactionByToken } = require('../services/paymentService');
const { getActiveSessionByToken } = require('../services/sessionService');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PUBLIC_STATUS = {
  pending: 'pending',
  failed: 'failed',
  paid: 'paid',
  review: 'processing', // money received, being checked by the provider
};

router.post('/status', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string' || !UUID_RE.test(token)) {
      return res.status(400).json({ error: 'Invalid token.' });
    }
    const activeSession = await getActiveSessionByToken(token);
if (activeSession) {
  if (!activeSession.network_activated) {
    return res.json({ status: 'activating' });
  }
  return res.json({ status: 'active', expiresAt: activeSession.expires_at });
}


    const transaction = await getTransactionByToken(token);
    if (!transaction) {
      return res.json({ status: 'not_found' });
    }

    res.json({ status: PUBLIC_STATUS[transaction.status] || 'pending' });
  } catch (err) {
    console.error('POST /api/sessions/status failed:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;