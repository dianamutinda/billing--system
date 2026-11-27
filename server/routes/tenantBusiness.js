const express = require('express');
const { pool } = require('../db');
const requireTenant = require('../middleware/requireTenant');

const router = express.Router();
router.use(requireTenant);

function normalizeBusinessPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  return null;
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT business_name, email, portal_slug, business_phone,
              business_location, business_description, portal_message
       FROM tenants
       WHERE id = $1
       LIMIT 1`,
      [req.tenantId]
    );
    const t = rows[0];
    if (!t) return res.status(404).json({ error: 'Not found' });

    return res.json({
      businessName: t.business_name,
      email: t.email,
      portalSlug: t.portal_slug,
      phone: t.business_phone || '',
      location: t.business_location || '',
      description: t.business_description || '',
      portalMessage: t.portal_message || '',
    });
  } catch (err) {
    console.error('business get failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

router.put('/', async (req, res) => {
  try {
    const body = req.body || {};

    // Optional text fields: must be a string within the limit, empty becomes NULL
    const optional = (value, max) => {
      if (value === undefined || value === null) return { ok: true, value: null };
      if (typeof value !== 'string') return { ok: false };
      const trimmed = value.trim();
      if (trimmed.length > max) return { ok: false };
      return { ok: true, value: trimmed === '' ? null : trimmed };
    };

    const name = typeof body.businessName === 'string' ? body.businessName.trim() : '';
    if (name.length < 1 || name.length > 100) {
      return res.status(400).json({ error: 'Business name is required (up to 100 characters)' });
    }

    const phone = optional(body.phone, 20);
    if (!phone.ok) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    const normalizedPhone = phone.value ? normalizeBusinessPhone(phone.value) : null;
    if (phone.value && !normalizedPhone) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const location = optional(body.location, 150);
    if (!location.ok) return res.status(400).json({ error: 'Location is too long' });

    const description = optional(body.description, 300);
    if (!description.ok) return res.status(400).json({ error: 'Description is too long' });

    const portalMessage = optional(body.portalMessage, 200);
    if (!portalMessage.ok) return res.status(400).json({ error: 'Welcome message is too long' });

    await pool.query(
      `UPDATE tenants
       SET business_name = $1,
           business_phone = $2,
           business_location = $3,
           business_description = $4,
           portal_message = $5
       WHERE id = $6`,
      [
        name,
        normalizedPhone,
        location.value,
        description.value,
        portalMessage.value,
        req.tenantId,
      ]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('business update failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;