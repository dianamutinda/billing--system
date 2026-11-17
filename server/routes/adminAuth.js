const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const requireAdmin = require('../middleware/requireAdmin');
const { pool } = require('../db');

const router = express.Router();

// A real bcrypt hash of a random string. Used so a wrong email takes
// the same time as a wrong password (stops attackers guessing which emails exist).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

// 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const { rows } = await pool.query(
      'SELECT id, password_hash FROM admins WHERE email = $1',
      [email]
    );
    const admin = rows[0];

    // Always run a compare, even if the email wasn't found
    const valid = await bcrypt.compare(password, admin ? admin.password_hash : DUMMY_HASH);

    if (!admin || !valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { sub: admin.id, role: 'admin' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ ok: true, adminId: req.adminId });
});
module.exports = router;