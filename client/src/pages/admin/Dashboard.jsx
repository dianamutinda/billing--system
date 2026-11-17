
import {
  Building2,
  Users,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wifi,
  CreditCard,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const stats = [
  {
    label: 'Total Tenants',
    value: '248',
    change: '+12.5%',
    trend: 'up',
    description: 'Compared to last month',
    icon: Building2,
  },
  {
    label: 'Active Tenants',
    value: '221',
    change: '+8.2%',
    trend: 'up',
    description: 'Currently using the platform',
    icon: Users,
  },
  {
    label: 'Subscription Revenue',
    value: 'KES 186,500',
    change: '+14.8%',
    trend: 'up',
    description: 'Compared to last month',
    icon: Wallet,
  },
  {
    label: 'Platform Growth',
    value: '18.4%',
    change: '-2.1%',
    trend: 'down',
    description: 'Tenant growth this month',
    icon: TrendingUp,
  },
];

const recentTenants = [
  {
    name: "Joe's Wi-Fi",
    email: 'joe@example.com',
    plan: 'Professional',
    date: 'Today, 10:42 AM',
    status: 'Active',
  },
  {
    name: 'Metro Hotspot',
    email: 'metro@example.com',
    plan: 'Starter',
    date: 'Today, 9:15 AM',
    status: 'Active',
  },
  {
    name: 'FastLink Networks',
    email: 'fastlink@example.com',
    plan: 'Business',
    date: 'Yesterday',
    status: 'Active',
  },
  {
    name: 'City Connect',
    email: 'city@example.com',
    plan: 'Starter',
    date: 'Yesterday',
    status: 'Pending',
  },
];

const activities = [
  {
    title: 'New tenant registered',
    detail: 'Metro Hotspot created an account',
    time: '15 minutes ago',
    icon: Building2,
  },
  {
    title: 'Subscription payment received',
    detail: 'KES 2,500 from Joe’s Wi-Fi',
    time: '1 hour ago',
    icon: CreditCard,
  },
  {
    title: 'Tenant account activated',
    detail: 'FastLink Networks is now active',
    time: '3 hours ago',
    icon: CheckCircle2,
  },
  {
    title: 'Subscription payment pending',
    detail: 'City Connect has an outstanding payment',
    time: '5 hours ago',
    icon: Clock3,
  },
];

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[var(--text-secondary)]">
            {item.label}
          </p>

          <h3 className="mt-3 break-words text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {item.value}
          </h3>
        </div>

        <div className="shrink-0 rounded-lg bg-[var(--primary-soft)] p-3">
          <Icon size={20} className="text-[var(--primary)]" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold ${
            item.trend === 'up'
              ? 'text-[var(--success)]'
              : 'text-[var(--danger)]'
          }`}
        >
          {item.trend === 'up' ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          {item.change}
        </span>

        <span className="text-xs text-[var(--text-muted)]">
          {item.description}
        </span>
      </div>
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">
        {title}
      </h2>

      {action && (
        <button
          type="button"
          className="shrink-0 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          {action}
        </button>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Platform Overview
        </h1>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Monitor your platform performance and tenant activity.
        </p>
      </div>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </section>

      {/* Growth and platform health */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Tenant growth */}
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
                Active tenants
              </span>
            </div>
          </div>

          <div className="mt-6 flex h-52 items-end justify-between gap-3 overflow-hidden border-b border-[var(--border)] px-1">
            {[
              { month: 'Jun', newTenants: 35, active: 55 },
              { month: 'Jul', newTenants: 45, active: 65 },
              { month: 'Aug', newTenants: 38, active: 72 },
              { month: 'Sep', newTenants: 58, active: 80 },
              { month: 'Oct', newTenants: 52, active: 88 },
              { month: 'Nov', newTenants: 72, active: 95 },
            ].map((item) => (
              <div
                key={item.month}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >
                <div className="flex h-full w-full max-w-12 items-end gap-1">
                  <div
                    className="w-1/2 rounded-t-sm bg-[var(--primary)]"
                    style={{ height: `${item.newTenants}%` }}
                  />

                  <div
                    className="w-1/2 rounded-t-sm bg-[var(--success)]"
                    style={{ height: `${item.active}%` }}
                  />
                </div>

                <span className="text-xs text-[var(--text-muted)]">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform health */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <SectionHeader title="Platform Health" />

          <div className="flex items-center gap-3 rounded-lg bg-[var(--primary-soft)] p-4">
            <Activity size={20} className="shrink-0 text-[var(--success)]" />

            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                All systems operational
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Platform services status
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Wifi size={17} />
                Router connections
              </div>

              <span className="text-sm font-semibold text-[var(--text-primary)]">
                198 / 221
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
              <div
                className="h-full rounded-full bg-[var(--success)]"
                style={{ width: '89.6%' }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <CheckCircle2 size={17} />
                Active tenants
              </div>

              <span className="text-sm font-semibold text-[var(--text-primary)]">
                221
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <AlertCircle size={17} />
                Pending tenants
              </div>

              <span className="text-sm font-semibold text-[var(--warning)]">
                27
              </span>
            </div>
          </div>

          <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs text-[var(--text-muted)]">
            Router connectivity is based on the latest reported status.
          </p>
        </div>
      </section>

      {/* Recent tenants and activity */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Recent tenants */}
        <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 xl:col-span-2">
          <SectionHeader title="Recently Registered Tenants" action="View all" />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                  <th className="px-3 py-3 font-medium">Business</th>
                  <th className="px-3 py-3 font-medium">Plan</th>
                  <th className="px-3 py-3 font-medium">Registered</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {recentTenants.map((tenant) => (
                  <tr
                    key={tenant.email}
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
                      {tenant.plan}
                    </td>

                    <td className="px-3 py-4 text-sm text-[var(--text-secondary)]">
                      {tenant.date}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          tenant.status === 'Active'
                            ? 'bg-[var(--primary-soft)] text-[var(--success)]'
                            : 'bg-[var(--bg-muted)] text-[var(--warning)]'
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <SectionHeader title="Recent Activity" />

          <div className="space-y-5">
            {activities.map((activity, index) => {
              const Icon = activity.icon;

              return (
                <div key={index} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-muted)]">
                    <Icon
                      size={17}
                      className="text-[var(--text-secondary)]"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {activity.title}
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {activity.detail}
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
