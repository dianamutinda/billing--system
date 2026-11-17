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

router.get('/me', requireTenant, (req, res) => {
  res.json({ ok: true, tenantId: req.tenantId });
});

module.exports = router;