const pool = require('../db');
const {revoke} = require('./networkService');


async function createSession(transaction, pkg) {
    const expiresAt = new Date(Date.now + pkg.duration_minutes * 60 * 1000);

    const result = await pool.query(
        `INSERT INTO sessions (phone_number, package_id, package_name, expires_at)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [transaction.phone, pkg.id, pkg.label, expiresAt]
    )
    return result.rows[0];
}

async function getAllSessions() {
    const result = await pool.query('SELECT * FROM sessions ORDER BY started_at DESC')
    return result.rows;
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
module.exports = { createSession, getAllSessions, expireOldSessions};