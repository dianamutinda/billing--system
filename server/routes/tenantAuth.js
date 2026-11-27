const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rl = require('express-rate-limit');
const rateLimit = rl.rateLimit || rl;
const { pool } = require('../db');
const requireTenant = require('../middleware/requireTenant');

const router = express.Router();
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;
const TRIAL_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const common = {
  windowMs: 15 * 60 * 1000,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
};

const ipLimiter = rateLimit({ ...common, max: 10 });
const emailLimiter = rateLimit({
  ...common,
  max: 10,
  keyGenerator: (req) => 'email:' + String(req.body?.email || '').trim().toLowerCase(),
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many signup attempts. Try again later.' },
});

const changePasswordLimiter = rateLimit({
  ...common,
  max: 5,
  keyGenerator: (req) => 'chpw:' + req.tenantId,
  message: { error: 'Too many attempts. Try again later.' },
});

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000,
  };
}

function issueSessionCookie(res, tenantId) {
  const token = jwt.sign(
    { sub: tenantId, role: 'tenant' },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );
  res.cookie('tenant_token', token, cookieOptions());
}

function buildBaseSlug(businessName) {
  const cleaned = String(businessName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return cleaned.length >= 2 ? cleaned : 'hotspot';
}

function makeSlugWithSuffix(base) {
  const suffix = crypto.randomBytes(2).toString('hex');
  return `${base.slice(0, 58)}-${suffix}`;
}

router.post('/signup', signupLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const email = String(body.email || '').trim().toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';
    const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : '';
    const requestedSlug =
      typeof body.portalSlug === 'string' && body.portalSlug.trim()
        ? body.portalSlug.trim().toLowerCase()
        : null;

    if (!EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (businessName.length < 1 || businessName.length > 100) {
      return res.status(400).json({ error: 'Business name must be 1 to 100 characters' });
    }
    // bcrypt only reads the first 72 bytes, so cap the length to avoid silent truncation
    if (password.length < 10 || Buffer.byteLength(password) > 72) {
      return res.status(400).json({ error: 'Password must be 10 to 72 characters' });
    }
    if (requestedSlug && !SLUG_RE.test(requestedSlug)) {
      return res.status(400).json({
        error: 'Portal slug must be 3 to 64 lowercase letters, numbers, or hyphens',
      });
    }

    const existing = await pool.query(
      'SELECT id FROM tenants WHERE lower(email) = $1 LIMIT 1',
      [email]
    );
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const baseSlug = buildBaseSlug(businessName);
    const now = new Date();
    const trialExpiresAt = new Date(now.getTime() + TRIAL_DURATION_MS);

    let created = null;
    const maxAttempts = requestedSlug ? 1 : 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const slug = requestedSlug || makeSlugWithSuffix(baseSlug);
      try {
        const result = await pool.query(
          `INSERT INTO tenants (
             email,
             password_hash,
             business_name,
             portal_slug,
             must_change_password,
             status,
             plan_expires_at,
             last_trial_started_at
           )
           VALUES ($1, $2, $3, $4, false, 'active', $5, $6)
           RETURNING id, business_name, portal_slug, plan_expires_at, last_trial_started_at`,
          [
            email,
            passwordHash,
            businessName,
            slug,
            trialExpiresAt.toISOString(),
            now.toISOString(),
          ]
        );
        created = result.rows[0];
        break;
      } catch (err) {
        if (err.code === '23505') {
          const detail = String(err.detail || '').toLowerCase();
          const constraint = String(err.constraint || '').toLowerCase();
          if (detail.includes('email') || constraint.includes('email')) {
            return res.status(409).json({ error: 'An account with this email already exists' });
          }
          if (requestedSlug) {
            return res.status(409).json({ error: 'Portal slug is already taken' });
          }
          continue;
        }
        throw err;
      }
    }

    if (!created) {
      return res.status(409).json({ error: 'Could not assign a unique portal slug. Try again.' });
    }

    issueSessionCookie(res, created.id);
    return res.status(201).json({
      ok: true,
      tenantId: created.id,
      businessName: created.business_name,
      portalSlug: created.portal_slug,
      planExpiresAt: created.plan_expires_at,
    });
  } catch (err) {
    console.error('Tenant signup error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/login', ipLimiter, emailLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    const { rows } = await pool.query(
      'SELECT id, password_hash, status, suspended_at FROM tenants WHERE lower(email) = $1 LIMIT 1',
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

    if (tenant.status === 'suspended') {
      return res.status(403).json({
        error: 'Tenant account is suspended',
        code: 'TENANT_SUSPENDED',
        suspended_at: tenant.suspended_at,
      });
    }

    issueSessionCookie(res, tenant.id);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Tenant login error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('tenant_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return res.json({ ok: true });
});

router.get('/me', requireTenant, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT business_name, portal_slug, must_change_password, status, plan_id, plan_expires_at, last_trial_started_at
       FROM tenants
       WHERE id = $1
       LIMIT 1`,
      [req.tenantId]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Unauthorized' });
    const row = rows[0];
    return res.json({
      ok: true,
      tenantId: req.tenantId,
      businessName: row.business_name,
      portalSlug: row.portal_slug,
      mustChangePassword: Boolean(row.must_change_password),
      status: row.status,
      planId: row.plan_id,
      planExpiresAt: row.plan_expires_at,
      lastTrialStartedAt: row.last_trial_started_at,
    });
  } catch (err) {
    console.error('tenant me failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
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
      'SELECT password_hash FROM tenants WHERE id = $1 LIMIT 1',
      [req.tenantId]
    );
    if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      `UPDATE tenants
       SET password_hash = $1, must_change_password = false
       WHERE id = $2`,
      [newHash, req.tenantId]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('change-password failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;