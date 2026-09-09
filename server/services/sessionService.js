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
module.exports = { createSession, sessions};