require('dotenv').config();
const { withTenant, pool } = require('../db');
const { getActiveSessionByPhone } = require('../services/sessionService');

const TENANT = '2b2e0f2b-10b8-4612-a1bc-a2578c32763f';
const PHONE = '254708374149';

async function main() {
  const seen = await withTenant(TENANT, async (client) => {
    const who = await client.query(
      "SELECT current_user AS role, current_setting('app.current_tenant_id', true) AS tenant"
    );
    const rows = await client.query(
      'SELECT id, status, expires_at, phone_number FROM sessions WHERE phone_number = $1 ORDER BY started_at DESC',
      [PHONE]
    );
    return { who: who.rows[0], rows: rows.rows };
  });
  console.log('tenant connection sees:', JSON.stringify(seen, null, 2));

  const active = await getActiveSessionByPhone(PHONE, TENANT);
  console.log('getActiveSessionByPhone:', active ? `FOUND ${active.id}` : 'NOT FOUND');
}

main()
  .catch((e) => console.error('Failed:', e.message))
  .finally(() => pool.end().then(() => process.exit()));