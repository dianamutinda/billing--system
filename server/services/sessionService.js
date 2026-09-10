const {revoke} = require('./networkService')
const crypto = require('crypto');

const sessions = new Map();

function createSession(transaction, pkg) {
    const id = crypto.randomUUID();
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + pkg.durationMinutes * 60 * 1000);

    const session = {
        id,
        phoneNumber: transaction.phone,
        packageId: pkg.id,
        packageName: pkg.label,
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'active',
        routerDeviceId: null,
    };

    sessions.set(id, session);
    return session;
}

async function expireOldSessions() {
    const now = new Date();

    for (const [id, session] of sessions) {
        if (session.status === 'active' && new Date(session.expiresAt) < now) {
            await revoke(session);
            session.status = 'expired';
            sessions.set(id, session);
            console.log(`session ${id} expired for ${session.phoneNumber}`);
            
        }
    }
}
module.exports = { createSession, sessions, expireOldSessions};