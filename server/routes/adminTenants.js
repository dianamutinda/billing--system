const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../db');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', async (req, res) => {
  try {
    const businessName = String(req.body.businessName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();

    if (businessName.length < 2 || businessName.length > 100) {
      return res.status(400).json({ error: 'Invalid business name' });
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Random temporary password, shown to you once and never stored in plain text
    const tempPassword = crypto.randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const { rows } = await pool.query(
      `INSERT INTO tenants (business_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, portal_slug, business_name, email`,
      [businessName, email, passwordHash]
    );

    res.status(201).json({ tenant: rows[0], tempPassword });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A tenant with that email already exists' });
    }
    console.error('Create tenant failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;