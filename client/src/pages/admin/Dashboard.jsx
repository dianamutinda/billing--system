import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Wallet,
  Wifi,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { getAdminDashboard } from '../../api/admin.js';
import { formatKes } from '../../api/dashboard.js';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Nairobi',
  });
}

// "2m ago", "3h ago", or a short date once it's more than a day old
function timeAgo(iso) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Nairobi',
  });
}

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

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[var(--text-secondary)]">{item.label}</p>

          <h3 className="mt-3 break-words text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {item.value}
          </h3>
        </div>

        <div className="shrink-0 rounded-lg bg-[var(--primary-soft)] p-3">
          <Icon size={20} className="text-[var(--primary)]" />
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        {item.description}
      </p>
    </div>
  );
}

function SectionHeader({ title, to, action }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">
        {title}
      </h2>

      {to && (
        <Link
          to={to}
          className="shrink-0 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          {action}
        </Link>
      )}
    </div>
  );
}

function ProgressRow({ icon: Icon, label, value, total }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Icon size={17} />
          {label}
        </div>

        <span className="text-sm font-semibold text-[var(--text-primary)]">
          {value} / {total}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
        <div
          className="h-full rounded-full bg-[var(--success)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        status === 'Active'
          ? 'bg-[var(--primary-soft)] text-[var(--success)]'
          : 'bg-[var(--bg-muted)] text-[var(--warning)]'
      }`}
    >
      {status}
    </span>
  );
}

// Monthly subscription revenue as a line chart.
// The line is an SVG; dots and labels are HTML so they stay round and sharp.
function RevenueChart({ data }) {
  const n = data.length;
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const hasData = data.some((d) => d.revenue > 0);

  // Positions are percentages of the plot area
  const xAt = (i) => (n === 1 ? 50 : 6 + (i * 88) / (n - 1));
  const yAt = (value) => 100 - (value / max) * 100;

  const linePath =
    'M' + data.map((d, i) => `${xAt(i)},${yAt(d.revenue)}`).join(' L');
  const areaPath = `${linePath} L${xAt(n - 1)},100 L${xAt(0)},100 Z`;

  const ticks = [4, 3, 2, 1, 0].map((k) => (max * k) / 4);

  return (
    <div className="mt-6 flex">
      {/* Y axis labels */}
      <div className="relative h-52 w-10 shrink-0">
        {ticks.map((tick, i) => (
          <span
            key={i}
            className="absolute right-2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]"
            style={{ top: `${i * 25}%` }}
          >
            {axisLabel(tick)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative h-52">
          {/* Grid lines */}
          {ticks.map((_, i) => (
            <div
              key={i}
              className="absolute inset-x-0 border-t border-dashed border-[var(--border)]"
              style={{ top: `${i * 25}%` }}
            />
          ))}

          {/* Line and fill */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--success)" stopOpacity=".18" />
                <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d={areaPath} fill="url(#revenueFill)" />

            <path
              d={linePath}
              fill="none"
              stroke="var(--success)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Dots */}
          {data.map((d, i) => (
            <div
              key={d.label + i}
              title={`${d.label}: ${formatKes(d.revenue)}`}
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--bg-surface)] bg-[var(--success)]"
              style={{ left: `${xAt(i)}%`, top: `${yAt(d.revenue)}%` }}
            />
          ))}

          {!hasData && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-[var(--text-secondary)]">
              No subscription payments recorded yet
            </p>
          )}
        </div>

        {/* Month labels with each month's amount */}
        <div className="relative mt-2 h-9">
          {data.map((d, i) => (
            <div
              key={d.label + i}
              className="absolute -translate-x-1/2 text-center"
              style={{ left: `${xAt(i)}%` }}
            >
              <p className="text-xs text-[var(--text-muted)]">{d.label}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">
                {d.revenue > 0 ? axisLabel(d.revenue) : '—'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const r = await getAdminDashboard();
      if (cancelled) return;
      if (r.ok) setData(r.data);
      else setError(r.data?.error || r.error || 'Could not load the dashboard');
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const subs = data?.subscriptions;

  const stats = data
    ? [
        {
          label: 'Total Tenants',
          value: String(data.totalTenants),
          description: `${subs.noPlan} without a plan`,
          icon: Building2,
        },
        {
          label: 'Active Subscriptions',
          value: String(subs.active),
          description: `${subs.expiringSoon} expiring within 7 days`,
          icon: CheckCircle2,
        },
        {
          label: 'Revenue This Month',
          value: formatKes(subs.revenueThisMonth),
          description: 'Subscription payments you recorded',
          icon: Wallet,
        },
        {
          label: 'Overdue',
          value: String(subs.overdue),
          description: 'Plan has expired',
          icon: AlertCircle,
        },
      ]
    : [];

  // Bars are drawn relative to the biggest running total
  const growthMax = data
    ? Math.max(1, ...data.tenantGrowth.map((m) => m.totalTenants))
    : 1;

  const totalSubscribers = data
    ? data.plans.reduce((sum, p) => sum + p.subscribers, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Platform Overview
        </h1>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Monitor your subscriptions, revenue and tenant activity.
        </p>
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
          {/* Statistics */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <StatCard key={item.label} item={item} />
            ))}
          </section>

          {/* Subscription revenue and plans */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 xl:col-span-2">
              <SectionHeader
                title="Subscription Revenue"
                to="/admin/subscriptions"
                action="Manage"
              />

              <p className="text-sm text-[var(--text-secondary)]">
                Payments you recorded from tenants, per month (KES).
              </p>

              <RevenueChart data={data.revenueTrend} />
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <SectionHeader
                title="Plans"
                to="/admin/subscriptions"
                action="View all"
              />

              {data.plans.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  No plans yet.{' '}
                  <Link
                    to="/admin/subscriptions/plans/new"
                    className="font-medium text-[var(--primary)] hover:underline"
                  >
                    Create your first plan
                  </Link>
                  .
                </p>
              ) : (
                <div className="space-y-5">
                  {data.plans.map((plan) => {
                    const share =
                      totalSubscribers > 0
                        ? Math.round((plan.subscribers / totalSubscribers) * 100)
                        : 0;

                    return (
                      <div key={plan.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                              {plan.name}
                              {!plan.isActive && (
                                <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
                                  Inactive
                                </span>
                              )}
                            </p>

                            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                              {formatKes(plan.price)} /{' '}
                              {plan.billingCycle === 'annually' ? 'year' : 'month'}
                            </p>
                          </div>

                          <span className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
                            {plan.subscribers}{' '}
                            <span className="font-normal text-[var(--text-muted)]">
                              {plan.subscribers === 1 ? 'tenant' : 'tenants'}
                            </span>
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                          <div
                            className="h-full rounded-full bg-[var(--primary)]"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Tenant growth and setup */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 xl:col-span-2">
              <SectionHeader title="Tenant Growth" />

              <div className="flex flex-wrap items-center gap-5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                  <span className="text-[var(--text-secondary)]">
                    New tenants
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]" />
                  <span className="text-[var(--text-secondary)]">
                    Total tenants
                  </span>
                </div>
              </div>

              <div className="mt-6 flex h-52 items-end justify-between gap-3 overflow-hidden border-b border-[var(--border)] px-1">
                {data.tenantGrowth.map((item) => (
                  <div
                    key={item.label}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    title={`${item.label}: ${item.newTenants} new, ${item.totalTenants} total`}
                  >
                    <div className="flex h-full w-full max-w-12 items-end gap-1">
                      <div
                        className="w-1/2 rounded-t-sm bg-[var(--primary)]"
                        style={{
                          height: `${(item.newTenants / growthMax) * 100}%`,
                        }}
                      />

                      <div
                        className="w-1/2 rounded-t-sm bg-[var(--success)]"
                        style={{
                          height: `${(item.totalTenants / growthMax) * 100}%`,
                        }}
                      />
                    </div>

                    <span className="text-xs text-[var(--text-muted)]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Hover a month to see its new and total tenants.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <SectionHeader title="Tenant Setup" />

              <div className="space-y-5">
                <ProgressRow
                  icon={Wifi}
                  label="Routers configured"
                  value={data.routersConfigured}
                  total={data.totalTenants}
                />

                <ProgressRow
                  icon={CreditCard}
                  label="M-Pesa configured"
                  value={data.paymentsConfigured}
                  total={data.totalTenants}
                />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <AlertCircle size={17} />
                    Pending tenants
                  </div>

                  <span className="text-sm font-semibold text-[var(--warning)]">
                    {data.pendingTenants}
                  </span>
                </div>
              </div>

              <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs text-[var(--text-muted)]">
                Shows which tenants have added their router and payment details.
                It does not test live connections.
              </p>
            </div>
          </section>

          {/* Recent tenants and subscription payments */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 xl:col-span-2">
              <SectionHeader
                title="Recently Registered Tenants"
                to="/admin/tenants"
                action="View all"
              />

              {data.recentTenants.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  No tenants yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                        <th className="px-3 py-3 font-medium">Business</th>
                        <th className="px-3 py-3 font-medium">Registered</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.recentTenants.map((tenant) => (
                        <tr
                          key={tenant.id}
                          className="border-b border-[var(--border)] last:border-0"
                        >
                          <td className="px-3 py-4">
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {tenant.name}
                            </p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                              {tenant.email}
                            </p>
                          </td>

                          <td className="px-3 py-4 text-sm text-[var(--text-secondary)]">
                            {formatDate(tenant.createdAt)}
                          </td>

                          <td className="px-3 py-4">
                            <StatusBadge status={tenant.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <SectionHeader
                title="Recent Subscription Payments"
                to="/admin/subscriptions"
                action="Manage"
              />

              {data.recentSubscriptionPayments.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  No payments recorded yet. Use "Record payment" on the
                  Subscriptions page when a tenant pays you.
                </p>
              ) : (
                <div className="space-y-5">
                  {data.recentSubscriptionPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-muted)]">
                        <CheckCircle2
                          size={17}
                          className="text-[var(--success)]"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {payment.tenant}
                        </p>

                        <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                          {payment.plan}
                          {payment.reference ? ` · ${payment.reference}` : ''}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {formatKes(payment.amount)}
                        </p>

                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {timeAgo(payment.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}