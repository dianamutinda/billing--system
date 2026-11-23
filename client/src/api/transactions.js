import { api } from './http.js';

const STATUS = {
  paid: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
  review: 'Review',
};

function fromApi(t) {
  const d = new Date(t.created_at);
  return {
    id: t.id,
    receipt: t.mpesa_receipt || '—',
    // 254712345678 -> 0712345678, as the screen shows it
    phone: t.phone ? `0${t.phone.slice(3)}` : '',
    package: t.package_label || 'Unknown package',
    amount: Number(t.amount) || 0,
    method: 'M-Pesa',
    date: d.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi',
    }),
    time: d.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi',
    }),
    status: STATUS[t.status] || 'Pending',
    note: t.result_desc || '',
  };
}

export async function listTransactions() {
  const r = await api('/api/tenant/transactions');
  return r.ok ? { ...r, data: r.data.map(fromApi) } : r;
}