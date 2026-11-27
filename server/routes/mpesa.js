const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { processStkCallback } = require('../services/paymentService');
const { activateSession } = require('../services/sessionService');

function secretMatches(given) {
  const expected = process.env.MPESA_CALLBACK_SECRET || '';
  if (expected.length < 16 || !given) return false;

  const a = Buffer.from(String(given));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

router.post('/callback/:secret', async (req, res) => {
  if (!secretMatches(req.params.secret)) {
    return res.status(404).end();
  }

  try {
    const cb = req.body?.Body?.stkCallback;
    if (cb && cb.CheckoutRequestID) {
      console.log(`M-Pesa callback ${cb.CheckoutRequestID} result ${cb.ResultCode}`);
      const outcome = await processStkCallback(cb);

      if (outcome && outcome.status === 'paid' && outcome.session) {
        // Attempt immediate activation; background sweeper retries if router is offline
        await activateSession(outcome.session);
      }
    }
  } catch (err) {
    console.error('M-Pesa callback processing failed:', err.message);
  }

  return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

module.exports = router;