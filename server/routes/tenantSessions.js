const express = require('express');
const { withTenant } = require('../db');
const requireTenant = require('../middleware/requireTenant');
const { revoke } = require('../services/networkService');

const router = express.Router();
router.use(requireTenant);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get('/', async (req, res) => {
  try {
    const rows = await withTenant(req.tenantId, async (client) => {
      const result = await client.query(
        `SELECT id, phone_number, package_name, started_at, expires_at,
                network_activated,
                CASE WHEN status = 'active' AND expires_at <= now()
                     THEN 'expired' ELSE status END AS status
         FROM sessions
         WHERE tenant_id = $1
         ORDER BY (status = 'active' AND expires_at > now()) DESC, started_at DESC
         LIMIT 200`,
        [req.tenantId]
      );
      return result.rows;
    });
    res.json(rows);
  } catch (err) {
    console.error('tenant sessions failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
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
         WHERE id = $1 AND tenant_id = $2 AND status = 'active' AND expires_at > now()`,
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
        `UPDATE sessions SET status = 'disconnected'
         WHERE id = $1 AND tenant_id = $2 AND status = 'active'`,
        [id, req.tenantId]
      )
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('tenant disconnect failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;