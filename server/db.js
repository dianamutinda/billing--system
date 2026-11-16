const { Pool } = require('pg');

const ssl = { rejectUnauthorized: false };

// Admin connection (postgres, bypasses RLS): only for the few queries that must cross tenants
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
  max: 5,
});

// Tenant connection (app_tenant, RLS enforced): used only by withTenant
const tenantPool = new Pool({
  connectionString: process.env.TENANT_DATABASE_URL,
  ssl,
  max: 10,
});

async function withTenant(tenantId, callback) {
  const client = await tenantPool.connect();
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
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, withTenant };