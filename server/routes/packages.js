const express = require('express');
const router = express.Router();
const { getAllPackages } = require('../services/packageService');
const { getTenantByPortalSlug } = require('../services/tenantService');

router.get('/:portalSlug', async (req, res) => {
  try {
    const rawSlug = String(req.params.portalSlug || '').trim();
    if (!rawSlug || rawSlug.length > 80) {
      return res.status(404).json({ error: 'Not found' });
    }

    const tenant = await getTenantByPortalSlug(rawSlug);
    if (!tenant) {
      return res.status(404).json({ error: 'Not found' });
    }

    const packages = await getAllPackages(tenant.id);

    // Never send internal columns or router/rate-limit internals to customers
    const publicPackages = packages.map(({ id, label, amount, duration_minutes }) => ({
      id,
      label,
      amount,
      duration_minutes,
    }));

    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return res.json(publicPackages);
  } catch (err) {
    console.error('GET /api/packages failed:', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;