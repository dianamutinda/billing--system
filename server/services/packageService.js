const pool = require('../db')

async function getAllPackages() {
  const result = await pool.query('SELECT * FROM packages');
  return result.rows;
}

async function getPackageById(id) {
  const result = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
  return result.rows[0];
}

module.exports = { getAllPackages, getPackageById };