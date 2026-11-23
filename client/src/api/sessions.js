import { api } from './http.js';

const STATUS = { active: 'Active', expired: 'Expired' };

function formatWhen(value) {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Nairobi',
  });
}

function fromApi(s) {
  return {
    id: s.id,
    // 254712345678 -> 0712345678
    phone: s.phone_number ? `0${s.phone_number.slice(3)}` : '',
    package: s.package_name,
    started: formatWhen(s.started_at),
    expires: formatWhen(s.expires_at),
    status: STATUS[s.status] || 'Disconnected',
    networkActivated: s.network_activated,
  };
}

export async function listSessions() {
  const r = await api('/api/tenant/sessions');
  return r.ok ? { ...r, data: r.data.map(fromApi) } : r;
}

export function disconnectSession(id) {
  return api(`/api/tenant/sessions/${encodeURIComponent(id)}/disconnect`, {
    method: 'POST',
    body: {},
  });
}