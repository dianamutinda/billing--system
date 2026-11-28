const { RouterOSAPI } = require('node-routeros');
const { adminPool } = require('../db');
const { decrypt } = require('./crypto');
const { applyStaticUser } = require('./staticRouterService');

async function updateStatuses() {
  await adminPool.query(
    `UPDATE static_users SET status = 'grace_period'
     WHERE status = 'active' AND expires_at <= now() AND grace_until > now()`);
  await adminPool.query(
    `UPDATE static_users SET status = 'suspended', sync_status = 'pending_sync'
     WHERE status IN ('active','grace_period')
       AND COALESCE(grace_until, expires_at) <= now()`);
}

async function syncOne(u) {
  let api;
  let error = null;
  try {
    api = new RouterOSAPI({
      host: u.router_host, user: u.router_user, port: u.router_port,
      password: decrypt(u.router_password_encrypted), timeout: 10
    });
    await api.connect();
    const allowed = ['active', 'grace_period'].includes(u.status);
    await applyStaticUser(api, u, u.manually_suspended || !allowed);
  } catch (err) {
    error = err.message;
  } finally {
    try { await api?.close(); } catch {}
  }
  // skip if the row changed while we were talking to the router
  await adminPool.query(
    `UPDATE static_users
     SET sync_status = $3, last_sync_error = $4,
         last_synced_at = CASE WHEN $3 = 'synced' THEN now() ELSE last_synced_at END
     WHERE id = $1 AND updated_at = $2::timestamptz`,
    [u.id, u.version, error ? 'sync_failed' : 'synced', error]);
}

let running = false;
async function runStaticSync() {
  if (running) return;
  running = true;
  try {
    await updateStatuses();
    const { rows } = await adminPool.query(
      `SELECT u.id, u.status, u.manually_suspended, u.mac_address,
              u.updated_at::text AS version, host(u.ip_address) AS ip,
              EXISTS (SELECT 1 FROM static_users o
                      WHERE o.tenant_id = u.tenant_id
                        AND o.ip_address = u.ip_address
                        AND o.id <> u.id
                        AND o.status <> 'cancelled') AS ip_taken,
              p.upload_kbps, p.download_kbps, t.router_host, t.router_user,
              t.router_port, t.router_password_encrypted
       FROM static_users u
       JOIN packages p ON p.id = u.package_id
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.sync_status IN ('pending_sync','sync_failed')`);
    for (const user of rows) {
      try { await syncOne(user); }
      catch (err) { console.error('Static sync:', user.id, err.message); }
    }
  } catch (err) {
    console.error('Static sync failed:', err.message);
  } finally {
    running = false;
  }
}

module.exports = { runStaticSync };