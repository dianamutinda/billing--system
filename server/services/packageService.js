const { withTenant } = require('../db')

async function getAllPackages(tenantId) {
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      'SELECT * FROM packages WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows;
  });
}

async function getPackageById(id, tenantId) {
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      'SELECT * FROM packages WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0];
  });
}

module.exports = { getAllPackages, getPackageById };