const express = require('express');
const router = express.Router();
const { getAllPackages } = require('../services/packageService');
const { getTenantByPortalSlug } = require('../services/tenantService');

router.get('/:portalSlug', async (req, res) => {
  try {
    const tenant = await getTenantByPortalSlug(req.params.portalSlug);
    if (!tenant) return res.status(404).json({ error: 'Not found' });

    const packages = await getAllPackages(tenant.id);

    // Never send internal columns to customers
    const publicPackages = packages.map(({ id, label, amount, duration_minutes }) => ({
  id, label, amount, duration_minutes,
}));
    res.json(publicPackages);
  } catch (err) {
    console.error('GET /api/packages failed:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;