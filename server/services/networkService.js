const { RouterOSAPI } = require('node-routeros');

function getConnection() {
    return new RouterOSAPI({
        host: process.env.MIKROTIK_HOST,
        user: process.env.MIKROTIK_USER,
        password: process.env.MIKROTIK_PASSWORD,
        port: Number(process.env.MIKROTIK_PORT),
    });
}

async function activate(session) {
    const now = Date.now();
    const expiresAtMs = new Date(session.expires_at).getTime();
    const remainingMs = expiresAtMs - now;
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    if (remainingMinutes <= 0) {
        return { success: false, error: 'Session already expired'};
    }

    const username = session.phone_number;
    const limitUptime = `${remainingMinutes}m`;
    const conn = getConnection();

    try {
        await conn.connect();

        await conn.write('/ip/hotspot/user/add', [
            `=name=${username}`,
            `=password=${username}`,
            `=limit-uptime=${limitUptime}`,
        ]);

        conn.close();

        return { success: true, networkUserId: username};
    } catch (err) {
        conn.close();
        return { success: false, error: err.message };
    }
}
async function revoke(session) {
    const username = session.phone_number;
    const conn = getConnection();

    try {
        await conn.connect();

        const found = await conn.write('/ip/hotspot/user/print', [
            `?name=${username}`,
        ]);

        if (found.length === 0) {
            conn.close();
            return { success: false, error: 'User not found on router'};
        }

        const userId = found[0]['.id'];

        await conn.write('/ip/hotspot/user/remove', [
            `=.id=${userId}`,
        ]);

        conn.close();
        return {success: true};
    } catch (err) {
        conn.close();
        return {success: false, error: err.message};
    }
}
module.exports = { activate, revoke };