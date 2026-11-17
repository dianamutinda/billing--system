require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email.includes('@')) throw new Error('Set ADMIN_EMAIL');
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');

  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO admins (email, password_hash) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [email, hash]
  );

  console.log('Admin saved:', email);
  await pool.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});