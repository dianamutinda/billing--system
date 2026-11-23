const express = require('express');
const { withTenant } = require('../db');
const requireTenant = require('../middleware/requireTenant');

const router = express.Router();
router.use(requireTenant);

router.get('/', async (req, res) => {
  try {
    const rows = await withTenant(req.tenantId, async (client) => {
      const result = await client.query(
        `SELECT t.id, t.mpesa_receipt, t.phone, t.status, t.result_desc, t.created_at,
                p.label AS package_label, p.amount
         FROM transactions t
         LEFT JOIN packages p ON p.id = t.package_id
         WHERE t.tenant_id = $1
         ORDER BY t.created_at DESC
         LIMIT 200`,
        [req.tenantId]
      );
      return result.rows;
    });
    res.json(rows);
  } catch (err) {
    console.error('tenant transactions failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;