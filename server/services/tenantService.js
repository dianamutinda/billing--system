
const pool = require('../db');

async function getTenantByPortalSlug(portalSlug) {
  const result = await pool.query(
    'SELECT * FROM tenants WHERE portal_slug = $1',
    [portalSlug]
  );
  return result.rows[0];
}

module.exports = { getTenantByPortalSlug };