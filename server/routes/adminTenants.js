const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../db');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(?:\+?254|0)[17]\d{8}$/;

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, business_name, email, created_at, portal_slug,
              business_phone, business_location, must_change_password,
              (router_host IS NOT NULL AND router_host <> '') AS router_configured,
              (daraja_shortcode IS NOT NULL AND daraja_shortcode <> '') AS payments_configured
       FROM tenants
       ORDER BY created_at DESC`
    );

    res.json(rows.map((t) => ({
      id: t.id,
      name: t.business_name,
      email: t.email,
      phone: t.business_phone || '',
      location: t.business_location || '',
      createdAt: t.created_at,
      portalSlug: t.portal_slug,
      // Pending = hasn't set their own password yet
      status: t.must_change_password ? 'Pending' : 'Active',
      routerStatus: t.router_configured ? 'Configured' : 'Not configured',
      paymentsConfigured: t.payments_configured,
    })));
  } catch (err) {
    console.error('Admin list tenants failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/', async (req, res) => {
  try {
    const businessName = String(req.body.businessName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    // Phone and location are optional: the tenant can fill them in later
    const phone = String(req.body.phone || '').replace(/[\s-]/g, '');
    const location = String(req.body.location || '').trim();

    if (businessName.length < 2 || businessName.length > 100) {
      return res.status(400).json({ error: 'Business name must be 2 to 100 characters' });
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (phone && !PHONE_RE.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    if (location.length > 150) {
      return res.status(400).json({ error: 'Location is too long' });
    }

    // Random temporary password, shown to you once and never stored in plain text
    const tempPassword = crypto.randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const { rows } = await pool.query(
      `INSERT INTO tenants
         (business_name, email, password_hash, must_change_password,
          business_phone, business_location)
       VALUES ($1, $2, $3, true, $4, $5)
       RETURNING id, portal_slug, business_name, email`,
      [businessName, email, passwordHash, phone || null, location || null]
    );

    // The response holds a password, so make sure nothing caches it
    res.set('Cache-Control', 'no-store');
    res.status(201).json({
      tenant: {
        id: rows[0].id,
        portalSlug: rows[0].portal_slug,
        businessName: rows[0].business_name,
        email: rows[0].email,
      },
      tempPassword,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A tenant with that email already exists' });
    }
    console.error('Create tenant failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;