require('dotenv').config({ quiet: true });
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

async function main() {
  const email = (process.env.TENANT_EMAIL || '').trim().toLowerCase();
  if (!email.includes('@')) throw new Error('Set TENANT_EMAIL');

  // 16 hex characters, so it's safe to paste into JSON and URLs
  const tempPassword = crypto.randomBytes(8).toString('hex');
  const hash = await bcrypt.hash(tempPassword, 12);

  const { rowCount } = await pool.query(
    `UPDATE tenants
     SET password_hash = $1, must_change_password = true
     WHERE lower(email) = $2`,
    [hash, email]
  );
  if (rowCount === 0) throw new Error('No tenant with that email');

  console.log('Temporary password for', email, ':', tempPassword);
  await pool.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});