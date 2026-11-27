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

      const expiresAtMs = new Date(activeSession.expires_at).getTime();
      const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));

      return res.json({
        status: 'active',
        expiresAt: activeSession.expires_at,
        remainingSeconds,
      });
    }

    const transaction = await getTransactionByToken(token);
    if (!transaction) {
      return res.json({ status: 'not_found' });
    }

    const publicStatus = PUBLIC_STATUS[transaction.status] || 'pending';
    const payload = { status: publicStatus };

    // Only surface a failure message when the payment actually failed
    if (publicStatus === 'failed') {
      payload.message =
        transaction.result_desc ||
        transaction.message ||
        transaction.error_message ||
        'Payment was not completed.';
    }

    return res.json(payload);
  } catch (err) {
    console.error('POST /api/sessions/status failed:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;