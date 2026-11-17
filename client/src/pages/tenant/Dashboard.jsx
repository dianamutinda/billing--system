
import {
  Bell,
  Users,
  Wallet,
  ReceiptText,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

const stats = [
  {
    title: 'Revenue Today',
    value: 'KES 4,850',
    change: '+12%',
    icon: Wallet,
  },
  {
    title: 'Active Sessions',
    value: '124',
    change: '+8%',
    icon: Users,
  },
  {
    title: 'This Month',
    value: 'KES 28,750',
    change: '+14%',
    icon: ReceiptText,
  },
];

const transactions = [
  {
    phone: '0712345678',
    package: '1 Hour Package',
    amount: 'KES 20',
    time: '2m ago',
  },
  {
    phone: '0723456789',
    package: 'Day Package',
    amount: 'KES 100',
    time: '5m ago',
  },
  {
    phone: '0709876543',
    package: '1 Hour Package',
    amount: 'KES 20',
    time: '8m ago',
  },
];

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
          <Icon size={20} />
        </div>

        <span className="flex items-center gap-1 text-xs font-semibold text-[var(--success)]">
          <ArrowUpRight size={14} />
          {item.change}
        </span>
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
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Sales Overview
        </h2>

        <div className="flex items-center gap-1 rounded-lg bg-[var(--bg-muted)] p-1">
          {['7D', '30D', '90D'].map((period, index) => (
            <button
              key={period}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                index === 0
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex flex-col justify-between pb-7">
          {[4000, 3000, 2000, 1000, 0].map((value) => (
            <div key={value} className="flex items-center gap-3">
              <span className="w-7 text-[10px] text-[var(--text-muted)]">
                {value === 0 ? '0' : `${value / 1000}k`}
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
              <stop
                offset="0%"
                stopColor="var(--success)"
                stopOpacity=".18"
              />
              <stop
                offset="100%"
                stopColor="var(--success)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          <path
            d="M10 130 C55 140 65 155 105 155 S165 130 205 115 S270 75 305 80 S365 105 405 110 S465 105 505 95 S555 65 590 55 L590 200 L10 200 Z"
            fill="url(#salesFill)"
          />

          <path
            d="M10 130 C55 140 65 155 105 155 S165 130 205 115 S270 75 305 80 S365 105 405 110 S465 105 505 95 S555 65 590 55"
            fill="none"
            stroke="var(--success)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {[
            [10, 130],
            [105, 155],
            [205, 115],
            [305, 80],
            [405, 110],
            [505, 95],
            [590, 55],
          ].map(([cx, cy], index) => (
            <circle
              key={index}
              cx={cx}
              cy={cy}
              r="4"
              fill="var(--success)"
              stroke="var(--bg-surface)"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      <div className="ml-10 mt-2 flex justify-between text-xs text-[var(--text-muted)]">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
    </div>
  );
}

function RecentTransactions() {
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

      <div className="space-y-5">
        {transactions.map((transaction) => (
          <div
            key={transaction.phone}
            className="flex items-center gap-3"
          >
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
    </div>
  );
}

export default function TenantDashboard() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Welcome back, Joe!
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

      {/* Metric cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <StatCard key={item.title} item={item} />
        ))}
      </section>

      {/* Analytics and transactions */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
        <SalesChart />
        <RecentTransactions />
      </section>

    </div>
  );
}
