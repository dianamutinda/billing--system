const { pool, withTenant } = require('../db');
const { revoke } = require('./networkService');

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
      'SELECT * FROM sessions WHERE tenant_id = $1 ORDER BY started_at DESC',
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

async function expireOldSessions() {
  const result = await pool.query(
    `SELECT * FROM sessions WHERE status = 'active' AND expires_at < now()`
  );

  for (const session of result.rows) {
    await revoke(session);
    await pool.query(`UPDATE sessions SET status = 'expired' WHERE id = $1`, [session.id]);
    console.log(`session ${session.id} expired for ${session.phone_number}`);
  }
}

module.exports = {
  createSession,
  getAllSessions,
  expireOldSessions,
  getActiveSessionByPhone,
  getActiveSessionByToken,
};