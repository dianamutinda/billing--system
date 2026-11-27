const express = require('express');
const { withTenant } = require('../db');
const requireTenant = require('../middleware/requireTenant');
const { revoke } = require('../services/networkService');

const router = express.Router();
router.use(requireTenant);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES = new Set(['active', 'expired', 'disconnected']);

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
      let filterSql = '';

      if (rawStatus === 'active') {
        filterSql = " AND status = 'active' AND expires_at > now()";
      } else if (rawStatus === 'expired') {
        filterSql = " AND (status = 'expired' OR (status = 'active' AND expires_at <= now()))";
      } else if (rawStatus === 'disconnected') {
        filterSql = " AND status = 'disconnected'";
      }

      params.push(limit, offset);
      const limitParam = `$${params.length - 1}`;
      const offsetParam = `$${params.length}`;

      const result = await client.query(
        `SELECT id, phone_number, package_name, started_at, expires_at,
                network_activated,
                CASE WHEN status = 'active' AND expires_at <= now()
                     THEN 'expired' ELSE status END AS status
         FROM sessions
         WHERE tenant_id = $1${filterSql}
         ORDER BY (status = 'active' AND expires_at > now()) DESC, started_at DESC
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        params
      );
      return result.rows;
    });

    return res.json(rows);
  } catch (err) {
    console.error('tenant sessions failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/:id/disconnect', async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) {
    return res.status(400).json({ error: 'Invalid session id' });
  }

  try {
    // 1. Find the session: this tenant's own, and only if it is still running
    const session = await withTenant(req.tenantId, async (client) => {
      const result = await client.query(
        `SELECT * FROM sessions
         WHERE id = $1 AND tenant_id = $2 AND status = 'active' AND expires_at > now()
         LIMIT 1`,
        [id, req.tenantId]
      );
      return result.rows[0];
    });
    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    // 2. Remove the customer from the router first
    const outcome = await revoke(session);
    if (!outcome.success) {
      console.error('disconnect: router revoke failed:', outcome.error);
      return res.status(502).json({
        error: 'Could not reach the router. The session is still active.',
      });
    }

    // 3. Only now mark it ended
    await withTenant(req.tenantId, (client) =>
      client.query(
        `UPDATE sessions
         SET status = 'disconnected'
         WHERE id = $1 AND tenant_id = $2 AND status = 'active'`,
        [id, req.tenantId]
      )
    );

    return res.json({ ok: true, status: 'disconnected' });
  } catch (err) {
    console.error('tenant disconnect failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;