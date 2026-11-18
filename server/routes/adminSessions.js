const express = require('express');
const { pool } = require('../db');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
router.use(requireAdmin);

// Show only the last 3 digits: the platform owner doesn't need full customer numbers
const mask = (phone) => (phone ? '254*****' + String(phone).slice(-3) : null);

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    const { rows } = await pool.query(
      `SELECT s.phone_number, s.status, s.expires_at, t.business_name
       FROM sessions s
       JOIN tenants t ON t.id = s.tenant_id
       ORDER BY s.expires_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json(rows.map((r) => ({
      tenant: r.business_name,
      phone: mask(r.phone_number),
      status: r.status,
      expiresAt: r.expires_at,
    })));
  } catch (err) {
    console.error('admin sessions failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;