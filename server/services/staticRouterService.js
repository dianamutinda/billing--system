// count first: node-routeros crashes on empty results
async function findIds(api, menu, ...query) {
  const [count] = await api.write(`${menu}/print`, ['=count-only=', ...query]);
  if (!Number(count?.ret)) return [];
  const rows = await api.write(`${menu}/print`, ['=.proplist=.id', ...query]);
  return rows.map((r) => r['.id']);
}

async function removeAll(api, menu, ...query) {
  for (const id of await findIds(api, menu, ...query)) {
    await api.write(`${menu}/remove`, [`=.id=${id}`]);
  }
}

async function applyStaticUser(api, user, blocked) {
  const name = `static-${user.id}`;
  const cancelled = user.status === 'cancelled';
  const reused = cancelled && user.ip_taken; // IP now belongs to someone else

  await removeAll(api, '/queue/simple', `?name=${name}`);
  await removeAll(api, '/ip/hotspot/ip-binding', `?comment=${name}`);
  await removeAll(api, '/ip/firewall/address-list',
    '?list=billing-blocked', `?comment=${name}`);
  if (!reused) {
    await removeAll(api, '/ip/firewall/address-list',
      '?list=billing-blocked', `?address=${user.ip}`);
  }

  if (blocked && !reused) {
    await api.write('/ip/firewall/address-list/add',
      ['=list=billing-blocked', `=address=${user.ip}`, `=comment=${name}`]);
  }
  if (cancelled) return;

  await api.write('/queue/simple/add', [
    `=name=${name}`,
    `=target=${user.ip}/32`,
    `=max-limit=${user.upload_kbps}k/${user.download_kbps}k`
  ]);
  if (user.mac_address) {
    await api.write('/ip/hotspot/ip-binding/add', [
      `=address=${user.ip}`, `=mac-address=${user.mac_address}`,
      '=type=bypassed', `=comment=${name}`
    ]);
  }
}

module.exports = { applyStaticUser };