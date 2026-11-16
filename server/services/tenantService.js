const pool = require('../db');
const { decrypt } = require('./crypto');

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


async function getTenantRouter(tenantId) {
  const { rows } = await pool.query(
    `SELECT router_host, router_user, router_password_encrypted, router_port
     FROM tenants WHERE id = $1`,
    [tenantId]
  );
  const t = rows[0];
  if (!t || !t.router_host || !t.router_password_encrypted) return null;
  return {
    host: t.router_host,
    user: t.router_user,
    password: decrypt(t.router_password_encrypted),
    port: Number(t.router_port) || 8728,
  };
}

module.exports = { getTenantByPortalSlug, getTenantRouter };