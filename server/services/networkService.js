const { RouterOSAPI, Channel } = require('node-routeros');
const { getTenantRouter } = require('./tenantService');

const originalProcessPacket = Channel.prototype.processPacket;
Channel.prototype.processPacket = function (packet) {
  if (packet[0] === '!empty') return;
  return originalProcessPacket.call(this, packet);
};

const USERNAME_RE = /^[a-zA-Z0-9._@-]{3,64}$/;
const MAC_RE = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i;
const RATE_LIMIT_RE = /^[0-9]+(\.[0-9]+)?[kMG]?\/[0-9]+(\.[0-9]+)?[kMG]?$/i;

function resolveUsername(session) {
  const candidate = String(session.username || session.code || session.phone_number || '').trim();
  if (!USERNAME_RE.test(candidate)) {
    throw new Error('Invalid hotspot username or voucher code');
  }
  return candidate;
}

function formatRouterOsRateLimit(session) {
  if (!session.rate_limit) return null;
  const trimmed = String(session.rate_limit).trim();
  if (!RATE_LIMIT_RE.test(trimmed)) {
    throw new Error('Invalid rate-limit format');
  }
  return trimmed;
}

function formatMacAddress(mac) {
  if (!mac) return null;
  const normalized = String(mac).trim().toUpperCase();
  if (!MAC_RE.test(normalized)) {
    throw new Error('Invalid MAC address format');
  }
  return normalized;
}

async function connect(session) {
  if (!session?.tenant_id) {
    throw new Error('Missing tenant_id for router connection');
  }

  // Pass session.router_id if getTenantRouter supports selecting a specific router
  const router = await getTenantRouter(session.tenant_id, session.router_id);
  if (!router) throw new Error('No router configured for tenant');

  const conn = new RouterOSAPI({
    host: router.host,
    user: router.user,
    password: router.password,
    port: Number(router.port) || 8728,
    timeout: 8,
  });

  conn.on('error', (err) => console.error('RouterOS error:', err.errno || err.message));
  await conn.connect();
  return conn;
}

function safeClose(conn) {
  try {
    if (conn) conn.close();
  } catch (_) {
    // Socket already closed
  }
}

async function safeWrite(conn, command, params = []) {
  const res = await conn.write(command, params);
  return Array.isArray(res) ? res : [];
}

async function removeActiveConnections(conn, username) {
  const active = await safeWrite(conn, '/ip/hotspot/active/print', [`?user=${username}`]);
  for (const entry of active) {
    if (entry['.id']) {
      await safeWrite(conn, '/ip/hotspot/active/remove', [`=.id=${entry['.id']}`]);
    }
  }
}

async function removeHotspotUsers(conn, username) {
  const users = await safeWrite(conn, '/ip/hotspot/user/print', [`?name=${username}`]);
  for (const user of users) {
    if (user['.id']) {
      await safeWrite(conn, '/ip/hotspot/user/remove', [`=.id=${user['.id']}`]);
    }
  }
}

async function removeUser(conn, username) {
  await removeActiveConnections(conn, username);
  await removeHotspotUsers(conn, username);
}

async function activate(session) {
  const expiresMs = new Date(session.expires_at).getTime();
  if (!Number.isFinite(expiresMs)) {
    return { success: false, error: 'Invalid session expiration timestamp' };
  }

  const remainingMinutes = Math.ceil((expiresMs - Date.now()) / 60000);
  if (remainingMinutes <= 0) {
    return { success: false, error: 'Session already expired' };
  }

  let conn;
  try {
    const username = resolveUsername(session);
    const password = String(session.hotspot_password || username);
    // Validate rate_limit format if present, though speed limits belong on hotspot user profiles
    formatRouterOsRateLimit(session);
    const macAddress = formatMacAddress(session.mac_address);

    conn = await connect(session);

    const existingUsers = await safeWrite(conn, '/ip/hotspot/user/print', [`?name=${username}`]);
    const params = [
      `=limit-uptime=${remainingMinutes}m`,
      `=password=${password}`,
    ];

    if (session.hotspot_profile) {
      params.push(`=profile=${String(session.hotspot_profile).trim()}`);
    }
    if (Number.isFinite(Number(session.data_limit_bytes)) && Number(session.data_limit_bytes) > 0) {
      params.push(`=limit-bytes-total=${Math.floor(Number(session.data_limit_bytes))}`);
    }
    if (macAddress) {
      params.push(`=mac-address=${macAddress}`);
    }

    if (existingUsers.length > 0) {
      for (const u of existingUsers) {
        if (u['.id']) {
          await safeWrite(conn, '/ip/hotspot/user/set', [`=.id=${u['.id']}`, ...params]);
        }
      }
    } else {
      await safeWrite(conn, '/ip/hotspot/user/add', [`=name=${username}`, ...params]);
    }

    return { success: true, networkUserId: username };
  } catch (err) {
    return { success: false, error: err?.message || 'Router activation failed' };
  } finally {
    safeClose(conn);
  }
}

async function revoke(session) {
  let conn;
  try {
    const username = resolveUsername(session);
    conn = await connect(session);
    await removeUser(conn, username);
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || 'Router revoke failed' };
  } finally {
    safeClose(conn);
  }
}

// Convenience wrapper for redeeming a voucher record on MikroTik
async function activateVoucher(voucher, options = {}) {
  return activate({
    tenant_id: voucher.tenant_id,
    router_id: voucher.router_id || options.router_id || null,
    username: voucher.code,
    hotspot_password: voucher.hotspot_password || voucher.code,
    expires_at: voucher.expires_at,
    hotspot_profile: voucher.hotspot_profile || options.hotspot_profile || null,
    rate_limit: voucher.rate_limit || options.rate_limit || null,
    data_limit_bytes: voucher.data_limit_bytes || options.data_limit_bytes || null,
    mac_address: options.mac_address || null,
  });
}

function groupVouchersByRouter(vouchers) {
  const groups = new Map();

  for (const voucher of vouchers) {
    const key = `${voucher.tenant_id}::${voucher.router_id || ''}`;
    if (!groups.has(key)) {
      groups.set(key, {
        tenant_id: voucher.tenant_id,
        router_id: voucher.router_id || null,
        vouchers: [],
      });
    }
    groups.get(key).vouchers.push(voucher);
  }

  return Array.from(groups.values());
}

// Returns a Map keyed by voucher.id -> { ok: boolean, error?: string }
async function revokeBatch(vouchers) {
  const outcomes = new Map();
  if (!Array.isArray(vouchers) || vouchers.length === 0) {
    return outcomes;
  }

  const groups = groupVouchersByRouter(vouchers);

  for (const group of groups) {
    let conn = null;
    try {
      conn = await connect({
        tenant_id: group.tenant_id,
        router_id: group.router_id,
      });

      for (const voucher of group.vouchers) {
        try {
          const username = resolveUsername({ username: voucher.code });
          await removeUser(conn, username);
          outcomes.set(voucher.id, { ok: true });
        } catch (err) {
          outcomes.set(voucher.id, {
            ok: false,
            error: err && err.message ? err.message : 'Revoke command failed',
          });
        }
      }
    } catch (connErr) {
      // Router connection itself failed: mark every voucher in this group as failed
      const msg = connErr && connErr.message ? connErr.message : 'Router connection failed';
      for (const voucher of group.vouchers) {
        outcomes.set(voucher.id, { ok: false, error: msg });
      }
    } finally {
      safeClose(conn);
    }
  }

  return outcomes;
}

module.exports = { activate, revoke, activateVoucher, revokeBatch };