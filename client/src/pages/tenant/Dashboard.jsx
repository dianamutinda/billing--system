import { useEffect, useState } from 'react';
import {
  Bell,
  Users,
  Wallet,
  ReceiptText,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { getDashboard, getSales, formatKes } from '../../api/dashboard.js';

// Round the top of the chart up to a tidy number (e.g. 3,870 -> 5,000)
function niceMax(value) {
  if (value <= 0) return 100;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

// 4000 -> "4k", 1500 -> "1.5k", 50 -> "50"
function axisLabel(v) {
  return v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(Math.round(v));
}

// '2026-11-23' -> "Mon" (7 days) or "23 Nov" (longer ranges)
function dayLabel(day, short) {
  const d = new Date(`${day}T00:00:00Z`);
  return short
    ? d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

// Chart drawing area inside the 600 x 230 SVG
const X0 = 10, X1 = 590, Y_TOP = 20, Y_BOTTOM = 200;

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
          <Icon size={20} />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          {item.value}
        </p>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {item.title}
        </p>
      </div>
    </div>
  );
}

function SalesChart() {
  const [days, setDays] = useState(7);
  const [series, setSeries] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setSeries(null);
    setError('');

    async function load() {
      const r = await getSales(days);
      if (cancelled) return;
      if (r.ok) setSeries(r.data);
      else setError(r.error || 'Could not load sales');
    }

    load();
    return () => { cancelled = true; };
  }, [days]);

  // Turn daily totals into points on the SVG
  const max = series ? niceMax(Math.max(...series.map((s) => s.total))) : 100;
  const points = series
    ? series.map((s, i) => ({
        x: X0 + (i * (X1 - X0)) / (series.length - 1),
        y: Y_BOTTOM - (s.total / max) * (Y_BOTTOM - Y_TOP),
      }))
    : [];

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
  const areaPath = points.length
    ? `${linePath} L${X1} ${Y_BOTTOM} L${X0} ${Y_BOTTOM} Z`
    : '';

  const ticks = [4, 3, 2, 1, 0].map((k) => (max * k) / 4);
  const hasSales = series && series.some((s) => s.total > 0);

  // 7 days: label every day. Longer: 5 evenly spaced labels.
  const labelIdx = series
    ? days === 7
      ? series.map((_, i) => i)
      : [0, 1, 2, 3, 4].map((k) => Math.round((k * (series.length - 1)) / 4))
    : [];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Sales Overview
        </h2>

        <div className="flex items-center gap-1 rounded-lg bg-[var(--bg-muted)] p-1">
          {RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setDays(range.days)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                days === range.days
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-[var(--text-secondary)]">{error}</p>}

      {!series && !error && (
        <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
      )}

      {series && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex flex-col justify-between pb-7">
              {ticks.map((value) => (
                <div key={value} className="flex items-center gap-3">
                  <span className="w-7 text-[10px] text-[var(--text-muted)]">
                    {axisLabel(value)}
                  </span>
                  <div className="h-px flex-1 border-t border-dashed border-[var(--border)]" />
                </div>
              ))}
            </div>

            <svg
              viewBox="0 0 600 230"
              className="relative z-10 w-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity=".18" />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path d={areaPath} fill="url(#salesFill)" />

              <path
                d={linePath}
                fill="none"
                stroke="var(--success)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />

              {days === 7 &&
                points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="var(--success)"
                    stroke="var(--bg-surface)"
                    strokeWidth="2"
                  />
                ))}
            </svg>

            {!hasSales && (
              <p className="absolute inset-0 z-20 flex items-center justify-center pb-7 text-sm text-[var(--text-secondary)]">
                No sales in this period
              </p>
            )}
          </div>

          <div className="ml-10 mt-2 flex justify-between text-xs text-[var(--text-muted)]">
            {labelIdx.map((i) => (
              <span key={series[i].day}>{dayLabel(series[i].day, days === 7)}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RecentTransactions({ items }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Recent Transactions
        </h2>

        <button className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline">
          View all
          <ChevronRight size={14} />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          No payments yet. They will appear here as customers buy packages.
        </p>
      ) : (
        <div className="space-y-5">
          {items.map((transaction) => (
            <div key={transaction.id} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--success)]">
                <CheckCircle2 size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {transaction.phone}
                </p>

                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {transaction.package}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {transaction.amount}
                </p>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {transaction.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TenantDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const r = await getDashboard();
      if (cancelled) return;
      if (r.ok) setData(r.data);
      else setError(r.error || 'Could not load the dashboard');
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const stats = data
    ? [
        { title: 'Revenue Today', value: formatKes(data.revenueToday), icon: Wallet },
        { title: 'Active Sessions', value: String(data.activeSessions), icon: Users },
        { title: 'This Month', value: formatKes(data.revenueMonth), icon: ReceiptText },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Welcome back!
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Here's what's happening with your hotspot today.
          </p>
        </div>

        <button
          aria-label="Notifications"
          className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
        >
          <Bell size={20} />
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
          {error}
        </p>
      )}

      {!data && !error && (
        <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
      )}

      {data && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((item) => (
              <StatCard key={item.title} item={item} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
            <SalesChart />
            <RecentTransactions items={data.recent} />
          </section>
        </>
      )}
    </div>
  );
}