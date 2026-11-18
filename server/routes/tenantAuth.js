const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rl = require('express-rate-limit');
const rateLimit = rl.rateLimit || rl;
const { pool } = require('../db');
const requireTenant = require('../middleware/requireTenant');

const router = express.Router();
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

const common = {
  windowMs: 15 * 60 * 1000,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
};

// Per IP, and per email so an attacker can't spread guesses across many IPs
const ipLimiter = rateLimit({ ...common, max: 10 });
const emailLimiter = rateLimit({
  ...common,
  max: 10,
  keyGenerator: (req) => 'email:' + String(req.body?.email || '').trim().toLowerCase(),
});

// Keyed by tenant id (set by requireTenant), so guesses can't be spread across IPs
const changePasswordLimiter = rateLimit({
  ...common,
  max: 5,
  keyGenerator: (req) => 'chpw:' + req.tenantId,
  message: { error: 'Too many attempts. Try again later.' },
});

router.post('/login', ipLimiter, emailLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const { rows } = await pool.query(
      'SELECT id, password_hash FROM tenants WHERE lower(email) = $1',
      [email]
    );
    const tenant = rows[0];

    const valid = await bcrypt.compare(
      password,
      tenant ? tenant.password_hash : DUMMY_HASH
    );
    if (!tenant || !valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { sub: tenant.id, role: 'tenant' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    res.cookie('tenant_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Tenant login error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('tenant_token', { httpOnly: true, sameSite: 'strict' });
  res.json({ ok: true });
});

router.get('/me', requireTenant, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT business_name, must_change_password FROM tenants WHERE id = $1',
      [req.tenantId]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Unauthorized' });
    res.json({
      ok: true,
      tenantId: req.tenantId,
      businessName: rows[0].business_name,
      mustChangePassword: rows[0].must_change_password,
    });
  } catch (err) {
    console.error('tenant me failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/change-password', requireTenant, changePasswordLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Invalid request' });
    }
    // bcrypt only reads the first 72 bytes, so cap the length to avoid silent truncation
    if (newPassword.length < 10 || Buffer.byteLength(newPassword) > 72) {
      return res.status(400).json({ error: 'Password must be 10 to 72 characters' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'New password must be different' });
    }

    const { rows } = await pool.query(
      'SELECT password_hash FROM tenants WHERE id = $1',
      [req.tenantId]
    );
    if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE tenants SET password_hash = $1, must_change_password = false WHERE id = $2',
      [newHash, req.tenantId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('change-password failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;