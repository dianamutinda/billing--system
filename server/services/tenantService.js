const { pool } = require('../db');
const { decrypt } = require('./crypto');

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,79}$/i;

async function getTenantByPortalSlug(portalSlug) {
  if (!portalSlug || typeof portalSlug !== 'string') {
    return null;
  }

  const normalized = portalSlug.trim();
  if (!SLUG_REGEX.test(normalized)) {
    return null;
  }

  const result = await pool.query(
    `SELECT id, business_name, portal_slug
     FROM tenants
     WHERE portal_slug = $1
     LIMIT 1`,
    [normalized]
  );

  return result.rows[0] || null;
}

// Accepts routerId for caller compatibility with networkService; currently resolves the router stored on tenants.
async function getTenantRouter(tenantId, _routerId = null) {
  if (!tenantId) return null;

  const { rows } = await pool.query(
    `SELECT router_host, router_user, router_password_encrypted, router_port
     FROM tenants
     WHERE id = $1
     LIMIT 1`,
    [tenantId]
  );

  const t = rows[0];
  if (!t || !t.router_host || !t.router_password_encrypted) {
    return null;
  }

  let password;
  try {
    password = decrypt(t.router_password_encrypted);
  } catch (err) {
    throw new Error(`Failed to decrypt router password for tenant ${tenantId}: ${err.message}`);
  }

  return {
    host: t.router_host,
    user: t.router_user || 'admin',
    password,
    port: Number(t.router_port) || 8728,
  };
}

module.exports = { getTenantByPortalSlug, getTenantRouter };