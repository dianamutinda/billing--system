const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { initiateStkPush } = require('../services/paymentService');
const { getPackageById } = require('../services/packageService');
const { getActiveSessionByPhone } = require('../services/sessionService');

const PHONE_REGEX = /^254\d{9}$/;

router.post('/', async (req, res) => {
  try {
    const { phone, packageId } = req.body;

    if (!phone || !PHONE_REGEX.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }
    if (!packageId) {
      return res.status(400).json({ error: 'packageId is required' });
    }

    const pkg = await getPackageById(packageId);
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid packageId.' });
    }

    const activeSession = await getActiveSessionByPhone(phone);
    if (activeSession) {
      return res.status(409).json({ error: 'You already have an active session.', expiresAt: activeSession.expires_at });
    }

    const token = crypto.randomUUID();
    const result = await initiateStkPush(phone, packageId, token);
    res.json({ ...result, token });
  } catch (err) {
    console.log('POST /api/purchase failed:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;