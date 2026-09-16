const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { initiateStkPush } = require('../services/paymentService');
const { getPackageById } = require('../services/packageService');
const { getActiveSessionByPhone } = require('../services/sessionService');
const { getTenantByPortalSlug } = require('../services/tenantService');

const PHONE_REGEX = /^254\d{9}$/;

router.post('/:portalSlug', async (req, res) => {
  try {
    const { portalSlug } = req.params;
    const { phone, packageId } = req.body;

    const tenant = await getTenantByPortalSlug(portalSlug);
    if (!tenant) {
      return res.status(404).json({ error: 'Unknown WiFi provider.' });
    }

    if (!phone || !PHONE_REGEX.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }
    if (!packageId) {
      return res.status(400).json({ error: 'packageId is required' });
    }

    const pkg = await getPackageById(packageId, tenant.id);
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid packageId.' });
    }

    const activeSession = await getActiveSessionByPhone(phone, tenant.id);
    if (activeSession) {
      return res.status(409).json({ error: 'You already have an active session.', expiresAt: activeSession.expires_at });
    }

    const token = crypto.randomUUID();
    const result = await initiateStkPush(phone, packageId, token, tenant.id);

    if (!result.CheckoutRequestID) {
      return res.status(502).json({ error: 'Payment provider did not accept the request. Please try again.' });
    }

    res.json({ ok: true, token });
  } catch (err) {
    console.log('POST /api/purchase failed:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;