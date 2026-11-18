const { Pool } = require('pg');

const ssl = { rejectUnauthorized: false };

// Admin connection (postgres, bypasses RLS): only for the few queries that must cross tenants
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
  max: 5,
  idleTimeoutMillis: 30000, // close idle connections ourselves, before the pooler drops them
});

// Tenant connection (app_tenant, RLS enforced): used only by withTenant
const tenantPool = new Pool({
  connectionString: process.env.TENANT_DATABASE_URL,
  ssl,
  max: 10,
  idleTimeoutMillis: 30000,
});

// A dropped idle connection must not crash the server.
// The pool discards the dead client and opens a new one on the next query.
pool.on('error', (err) => {
  console.error('Idle admin-pool client error:', err.message);
});

tenantPool.on('error', (err) => {
  console.error('Idle tenant-pool client error:', err.message);
});

async function withTenant(tenantId, callback) {
  const client = await tenantPool.connect();
  let broken = false;
  try {
    await client.query('BEGIN');
    await client.query(
      "SELECT set_config('app.current_tenant_id', $1, true)",
      [String(tenantId)]
    );
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      broken = true; // the connection itself died, so the rollback failed too
    }
    throw err; // always surface the ORIGINAL error
  } finally {
    client.release(broken); // true tells the pool to destroy this client, not reuse it
  }
}

module.exports = { pool, withTenant };