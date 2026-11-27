const { withTenant } = require('../db');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getAllPackages(tenantId) {
  if (!tenantId) return [];

  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `SELECT id, label, amount, duration_minutes
       FROM packages
       WHERE tenant_id = $1 AND active = true
       ORDER BY duration_minutes ASC, label ASC`,
      [tenantId]
    );
    return result.rows;
  });
}

async function getPackageById(id, tenantId, { activeOnly = false } = {}) {
  if (!tenantId || !id || !UUID_RE.test(String(id))) {
    return null;
  }

  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `SELECT id, label, amount, duration_minutes, active
       FROM packages
       WHERE id = $1 AND tenant_id = $2 AND ($3::boolean = false OR active = true)
       LIMIT 1`,
      [id, tenantId, Boolean(activeOnly)]
    );
    return result.rows[0] || null;
  });
}

module.exports = { getAllPackages, getPackageById };