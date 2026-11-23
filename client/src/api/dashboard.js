import { api } from './http.js';

// 254712345678 -> 0712345678, same as the transactions screen
function formatPhone(phone) {
  return phone ? `0${phone.slice(3)}` : '';
}

// "2m ago", "3h ago", or a short date once it's more than a day old
function timeAgo(iso) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', timeZone: 'Africa/Nairobi',
  });
}

// "KES 4,850"
export function formatKes(n) {
  return `KES ${Number(n || 0).toLocaleString('en-KE')}`;
}

function recentFromApi(t) {
  return {
    id: t.id,
    phone: formatPhone(t.phone),
    package: t.package || 'Unknown package',
    amount: formatKes(t.amount),
    time: timeAgo(t.createdAt),
  };
}

// Cards + recent transactions
export async function getDashboard() {
  const r = await api('/api/tenant/dashboard');
  if (!r.ok) return r;
  return {
    ...r,
    data: {
      revenueToday: r.data.revenueToday,
      revenueMonth: r.data.revenueMonth,
      activeSessions: r.data.activeSessions,
      recent: r.data.recentTransactions.map(recentFromApi),
    },
  };
}

// Chart data: [{ day: '2026-11-17', total: 0 }, ...] for 7, 30 or 90 days
export async function getSales(days = 7) {
  return api(`/api/tenant/dashboard/sales?days=${days}`);
}