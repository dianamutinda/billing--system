const express = require('express');
const rl = require('express-rate-limit');
const rateLimit = rl.rateLimit || rl;
const { getTenantByPortalSlug } = require('../services/tenantService');
const { getAllPackages } = require('../services/packageService');

const router = express.Router();

const listLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again shortly.' },
});

router.get('/:portalSlug/packages', listLimiter, async (req, res) => {
  try {
    const tenant = await getTenantByPortalSlug(req.params.portalSlug);
    if (!tenant) return res.status(404).json({ error: 'Unknown WiFi provider.' });

    const packages = await getAllPackages(tenant.id); // active packages only
    res.json({
      businessName: tenant.business_name || null,
      packages: packages.map((p) => ({
        id: p.id,
        label: p.label,
        amount: p.amount,
        duration_minutes: p.duration_minutes,
      })),
    });
  } catch (err) {
    console.error('portal packages failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;