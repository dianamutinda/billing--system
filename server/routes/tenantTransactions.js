const express = require('express');
const { withTenant } = require('../db');
const requireTenant = require('../middleware/requireTenant');

const router = express.Router();
router.use(requireTenant);

const ALLOWED_STATUSES = new Set(['pending', 'paid', 'failed', 'review']);

router.get('/', async (req, res) => {
  try {
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const rawOffset = Number.parseInt(req.query.offset, 10);
    const rawStatus = typeof req.query.status === 'string' ? req.query.status.trim() : '';

    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 100;
    const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

    if (rawStatus && !ALLOWED_STATUSES.has(rawStatus)) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }

    const rows = await withTenant(req.tenantId, async (client) => {
      const params = [req.tenantId];
      let whereClause = 'WHERE t.tenant_id = $1';

      if (rawStatus) {
        params.push(rawStatus);
        whereClause += ` AND t.status = $${params.length}`;
      }

      params.push(limit, offset);
      const limitParam = `$${params.length - 1}`;
      const offsetParam = `$${params.length}`;

      const result = await client.query(
        `SELECT t.id, t.mpesa_receipt, t.phone, t.status, t.result_desc, t.created_at,
                COALESCE(t.package_label, p.label) AS package_label,
                COALESCE(t.amount, p.amount) AS amount
         FROM transactions t
         LEFT JOIN packages p ON p.id = t.package_id
         ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        params
      );
      return result.rows;
    });

    return res.json(rows);
  } catch (err) {
    console.error('tenant transactions failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;