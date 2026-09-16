const pool = require('../db');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getTenantByPortalSlug(portalSlug) {
  if (!UUID_REGEX.test(portalSlug)) {
    return undefined;
  }

  const result = await pool.query(
    'SELECT * FROM tenants WHERE portal_slug = $1',
    [portalSlug]
  );
  return result.rows[0];
}

module.exports = { getTenantByPortalSlug };