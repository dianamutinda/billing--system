const express = require('express');
const net = require('net');
const { pool } = require('../db');
const requireTenant = require('../middleware/requireTenant');
const { encrypt } = require('../services/crypto');

const router = express.Router();
router.use(requireTenant);

// The server connects to whatever host the tenant types in, so refuse
// addresses that would let them probe the server itself or cloud metadata.
function hostAllowed(host) {
  if (net.isIPv4(host)) {
    const [a, b] = host.split('.').map(Number);
    return !(a === 0 || a === 127 || (a === 169 && b === 254) || a >= 224);
  }
  if (net.isIPv6(host)) return false; // IPv4 only for now
  return /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/i.test(host) && host.toLowerCase() !== 'localhost';
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT router_host, router_user, router_port,
              (router_password_encrypted IS NOT NULL) AS has_password
       FROM tenants WHERE id = $1`,
      [req.tenantId]
    );
    const r = rows[0];
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json({ host: r.router_host, user: r.router_user, port: r.router_port, hasPassword: r.has_password });
  } catch (err) {
    console.error('router get failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { host, user, port = 8728, password } = req.body || {};

    if (typeof host !== 'string' || !hostAllowed(host.trim())) {
      return res.status(400).json({ error: 'Invalid router host' });
    }
    if (typeof user !== 'string' || user.trim().length < 1 || user.length > 64) {
      return res.status(400).json({ error: 'Invalid router user' });
    }
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return res.status(400).json({ error: 'Invalid router port' });
    }
    // Password is optional on update: leave it out to keep the stored one
    if (password !== undefined && (typeof password !== 'string' || password.length < 1 || password.length > 256)) {
      return res.status(400).json({ error: 'Invalid router password' });
    }

    const encrypted = password === undefined ? null : encrypt(password);

    await pool.query(
      `UPDATE tenants
       SET router_host = $1, router_user = $2, router_port = $3,
           router_password_encrypted = COALESCE($4, router_password_encrypted)
       WHERE id = $5`,
      [host.trim(), user.trim(), port, encrypted, req.tenantId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('router update failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;