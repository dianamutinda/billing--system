const { withTenant } = require('../db');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getAllPackages(tenantId) {
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `SELECT id, label, amount, duration_minutes
       FROM packages
       WHERE tenant_id = $1 AND active
       ORDER BY duration_minutes, label`,
      [tenantId]
    );
    return result.rows;
  });
}

async function getPackageById(id, tenantId, { activeOnly = false } = {}) {
  if (!UUID_RE.test(String(id))) return undefined;
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `SELECT id, label, amount, duration_minutes, active
       FROM packages
       WHERE id = $1 AND tenant_id = $2 AND ($3::boolean = false OR active)`,
      [id, tenantId, activeOnly]
    );
    return result.rows[0];
  });
}

module.exports = { getAllPackages, getPackageById };