require('dotenv').config();           // must come first: crypto.js reads ENCRYPTION_KEY on load
const readline = require('readline');
const { pool } = require('../db');
const { encrypt } = require('../services/crypto'); // same path as above

function ask(rl, q) {
  return new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())));
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const tenantId = await ask(rl, 'Tenant id (uuid): ');
  const shortcode = await ask(rl, 'Shortcode: ');
  const consumerKey = await ask(rl, 'Consumer key: ');
  const consumerSecret = await ask(rl, 'Consumer secret: ');
  const passkey = await ask(rl, 'Passkey: ');
  const env = (await ask(rl, 'Environment (sandbox/live) [sandbox]: ')) || 'sandbox';
  rl.close();

  if (!['sandbox', 'live'].includes(env)) throw new Error('Environment must be sandbox or live');
  if (![shortcode, consumerKey, consumerSecret, passkey].every(Boolean)) {
    throw new Error('All values are required');
  }

    const r = await pool.query(
    `UPDATE tenants
     SET daraja_shortcode = $1,
         daraja_consumer_key = $2,
         daraja_consumer_secret_encrypted = $3,
         daraja_passkey_encrypted = $4,
         daraja_env = $5
     WHERE id = $6`,
    [shortcode, consumerKey, encrypt(consumerSecret), encrypt(passkey), env, tenantId]
  );
  if (r.rowCount !== 1) throw new Error('No tenant with that id');
  console.log('Saved Daraja credentials for', tenantId, `(${env})`);
}

main()
  .catch((err) => { console.error('Failed:', err.message); process.exitCode = 1; })
  .finally(() => pool.end());