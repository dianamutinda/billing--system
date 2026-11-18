import { api } from './http.js';

const UNIT_MINUTES = { minutes: 1, hours: 60, days: 1440 };

export function toMinutes(value, unit) {
  return Number(value) * (UNIT_MINUTES[unit] || 0);
}

// Pick the biggest unit that divides evenly, so 1440 shows as "1 day"
export function splitMinutes(m) {
  if (m % 1440 === 0) return { value: m / 1440, unit: 'days' };
  if (m % 60 === 0) return { value: m / 60, unit: 'hours' };
  return { value: m, unit: 'minutes' };
}

export function formatDuration(m) {
  const { value, unit } = splitMinutes(m);
  return `${value} ${value === 1 ? unit.slice(0, -1) : unit}`;
}

// Server shape -> your screen's shape
function fromApi(p) {
  return {
    id: p.id,
    name: p.label,
    price: p.amount,
    durationMinutes: p.duration_minutes,
    duration: formatDuration(p.duration_minutes),
    status: p.active ? 'Active' : 'Inactive',
  };
}

export async function listPackages() {
  const r = await api('/api/tenant/packages');
  return r.ok ? { ...r, data: r.data.map(fromApi) } : r;
}

// Server wants camelCase on writes (durationMinutes) but sends snake_case on reads
export function createPackage({ name, price, durationMinutes }) {
  return api('/api/tenant/packages', {
    method: 'POST',
    body: { label: name, amount: price, durationMinutes },
  });
}

export function updatePackage(id, { name, price, durationMinutes, active }) {
  const body = {};
  if (name !== undefined) body.label = name;
  if (price !== undefined) body.amount = price;
  if (durationMinutes !== undefined) body.durationMinutes = durationMinutes;
  if (active !== undefined) body.active = active;
  return api(`/api/tenant/packages/${id}`, { method: 'PATCH', body });
}