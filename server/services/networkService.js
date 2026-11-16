const { RouterOSAPI } = require('node-routeros');
const { getTenantRouter } = require('./tenantService');

async function connect(session) {
  const router = await getTenantRouter(session.tenant_id);
  if (!router) throw new Error('No router configured for tenant');
  const conn = new RouterOSAPI({ ...router, timeout: 8 });
  await conn.connect();
  return conn;
}

function safeClose(conn) {
  try { if (conn) conn.close(); } catch (_) { /* already closed */ }
}

// Removes any active connection and any hotspot user with this name.
// Safe to call when nothing exists.
async function removeUser(conn, username) {
  if (!/^254\d{9}$/.test(username)) throw new Error('Invalid username');

  const active = await conn.write('/ip/hotspot/active/print', [`?user=${username}`]);
  for (const a of active) {
    await conn.write('/ip/hotspot/active/remove', [`=.id=${a['.id']}`]);
  }

  const users = await conn.write('/ip/hotspot/user/print', [`?name=${username}`]);
  for (const u of users) {
    await conn.write('/ip/hotspot/user/remove', [`=.id=${u['.id']}`]);
  }
}

async function activate(session) {
  const remainingMinutes = Math.ceil(
    (new Date(session.expires_at).getTime() - Date.now()) / 60000
  );
  if (remainingMinutes <= 0) {
    return { success: false, error: 'Session already expired' };
  }

  const username = session.phone_number;
  let conn;
  try {
    conn = await connect(session);
    await removeUser(conn, username); // clear leftovers so "add" never collides
    await conn.write('/ip/hotspot/user/add', [
      `=name=${username}`,
      `=password=${username}`,
      `=limit-uptime=${remainingMinutes}m`,
    ]);
    return { success: true, networkUserId: username };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    safeClose(conn);
  }
}

async function revoke(session) {
  let conn;
  try {
    conn = await connect(session);
    await removeUser(conn, session.phone_number);
    return { success: true }; // "nothing to remove" also counts as success
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    safeClose(conn);
  }
}

module.exports = { activate, revoke };