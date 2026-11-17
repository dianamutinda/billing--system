const { pool, withTenant } = require('../db');
const { revoke, activate } = require('./networkService');

async function createSession(transaction, pkg, tenantId) {
  const expiresAt = new Date(Date.now() + pkg.duration_minutes * 60 * 1000);

  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `INSERT INTO sessions (phone_number, package_id, package_name, expires_at, token, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [transaction.phone, pkg.id, pkg.label, expiresAt, transaction.token, tenantId]
    );
    return result.rows[0];
  });
}

async function getAllSessions(tenantId) {
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      'SELECT * FROM sessions WHERE tenant_id = $1 ORDER BY started_at DESC LIMIT 200',
      [tenantId]
    );
    return result.rows;
  });
}

async function getActiveSessionByPhone(phone, tenantId) {
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `SELECT * FROM sessions WHERE phone_number = $1 AND tenant_id = $2 AND status = 'active' AND expires_at > now()`,
      [phone, tenantId]
    );
    return result.rows[0];
  });
}

async function getActiveSessionByToken(token) {
  const result = await pool.query(
    `SELECT * FROM sessions WHERE token = $1 AND status = 'active' AND expires_at > now()`,
    [token]
  );
  return result.rows[0];
}

async function activateSession(session) {
  const result = await activate(session);
  if (result.success) {
    await pool.query(
      `UPDATE sessions SET network_activated = true WHERE id = $1`,
      [session.id]
    );
    return true;
  }
  console.error(`activation failed for session ${session.id} (tenant ${session.tenant_id}): ${result.error}`);
  return false;
}

let activating = false;

async function activatePendingSessions() {
  if (activating) return;
  activating = true;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM sessions
       WHERE status = 'active' AND network_activated = false AND expires_at > now()
       ORDER BY started_at LIMIT 50`
    );
    const failedTenants = new Set();
    for (const session of rows) {
      if (failedTenants.has(session.tenant_id)) continue;
      const ok = await activateSession(session);
      if (!ok) failedTenants.add(session.tenant_id);
    }
  } finally {
    activating = false;
  }
}

let sweeping = false;

async function expireOldSessions() {
  if (sweeping) return;
  sweeping = true;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM sessions
       WHERE status = 'active' AND expires_at < now()
       ORDER BY expires_at`
    );

    const failedTenants = new Set();

    for (const session of rows) {
      if (failedTenants.has(session.tenant_id)) continue;
      try {
        const result = await revoke(session);
if (!result.success) throw new Error(result.error);
        await pool.query(
          `UPDATE sessions SET status = 'expired' WHERE id = $1 AND status = 'active'`,
          [session.id]
        );
        console.log(`session ${session.id} expired (tenant ${session.tenant_id})`);
      } catch (err) {
        failedTenants.add(session.tenant_id);
        console.error(`expiry failed for session ${session.id} (tenant ${session.tenant_id}):`, err.message);
      }
    }
  } finally {
    sweeping = false;
  }
}

async function getAllSessionsForOwner(limit = 200) {
  const result = await pool.query(
    `SELECT s.*, t.business_name
     FROM sessions s JOIN tenants t ON t.id = s.tenant_id
     ORDER BY s.started_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

module.exports = {
  createSession,
  getAllSessions,
  expireOldSessions,
  getActiveSessionByPhone,
  getActiveSessionByToken,
  getAllSessionsForOwner,
  activatePendingSessions,
  activateSession,

};