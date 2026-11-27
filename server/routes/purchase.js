const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { initiateStkPush, normalizeKenyanPhone } = require('../services/paymentService');
const { getPackageById } = require('../services/packageService');
const { getTenantByPortalSlug } = require('../services/tenantService');

const MAC_REGEX = /^([0-9A-F]{2}[:-]){5}[0-9A-F]{2}$/i;

router.post('/:portalSlug', async (req, res) => {
  try {
    const { portalSlug } = req.params;
    const { phone: rawPhone, packageId, macAddress } = req.body;

    const tenant = await getTenantByPortalSlug(portalSlug);
    if (!tenant) {
      return res.status(404).json({ error: 'Unknown WiFi provider.' });
    }

    const phone = normalizeKenyanPhone(rawPhone);
    if (!phone) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }

    if (!packageId) {
      return res.status(400).json({ error: 'packageId is required.' });
    }

    if (macAddress !== undefined && macAddress !== null && macAddress !== '') {
      if (typeof macAddress !== 'string' || !MAC_REGEX.test(macAddress.trim())) {
        return res.status(400).json({ error: 'Invalid macAddress.' });
      }
    }

    const pkg = await getPackageById(packageId, tenant.id, { activeOnly: true });
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid packageId.' });
    }

    const token = crypto.randomUUID();
    const result = await initiateStkPush(phone, packageId, token, tenant.id);

    if (!result.CheckoutRequestID) {
      return res.status(502).json({
        error: 'Payment provider did not accept the request. Please try again.',
      });
    }

    return res.json({ ok: true, token });
  } catch (err) {
    console.error('POST /api/purchase failed:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;