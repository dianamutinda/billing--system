
import { useState } from 'react';
import {
  Search,
  ReceiptText,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Eye,
} from 'lucide-react';

const initialTransactions = [
  {
    id: 1,
    receipt: 'RKL7A2B9C1',
    phone: '0712345678',
    package: '1 Hour Package',
    amount: 20,
    method: 'M-Pesa',
    date: '17 Nov 2026',
    time: '10:30 AM',
    status: 'Completed',
  },
  {
    id: 2,
    receipt: 'RKL7A2B9C2',
    phone: '0723456789',
    package: 'Daily Package',
    amount: 100,
    method: 'M-Pesa',
    date: '17 Nov 2026',
    time: '10:15 AM',
    status: 'Completed',
  },
  {
    id: 3,
    receipt: 'RKL7A2B9C3',
    phone: '0709876543',
    package: 'Weekly Package',
    amount: 350,
    method: 'M-Pesa',
    date: '17 Nov 2026',
    time: '09:45 AM',
    status: 'Pending',
  },
  {
    id: 4,
    receipt: 'RKL7A2B9C4',
    phone: '0798765432',
    package: '1 Hour Package',
    amount: 20,
    method: 'M-Pesa',
    date: '17 Nov 2026',
    time: '09:20 AM',
    status: 'Failed',
  },
  {
    id: 5,
    receipt: 'RKL7A2B9C5',
    phone: '0756789012',
    package: 'Monthly Package',
    amount: 1000,
    method: 'M-Pesa',
    date: '16 Nov 2026',
    time: '04:30 PM',
    status: 'Completed',
  },
];

export default function TenantTransactions() {
  const [transactions] = useState(initialTransactions);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');

  const completedTransactions = transactions.filter(
    (transaction) => transaction.status === 'Completed'
  );

  const totalRevenue = completedTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  const pendingCount = transactions.filter(
    (transaction) => transaction.status === 'Pending'
  ).length;

  const failedCount = transactions.filter(
    (transaction) => transaction.status === 'Failed'
  ).length;

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.phone.includes(search) ||
      transaction.receipt.toLowerCase().includes(search.toLowerCase()) ||
      transaction.package.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || transaction.status === statusFilter;

    const matchesMethod =
      methodFilter === 'All' || transaction.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Track customer payments and monitor your payment activity.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Revenue"
          value={`KES ${totalRevenue.toLocaleString()}`}
          icon={Wallet}
          color="success"
        />

        <SummaryCard
          label="Transactions"
          value={transactions.length}
          icon={ReceiptText}
        />

        <SummaryCard
          label="Pending Payments"
          value={pendingCount}
          icon={Clock}
          color="warning"
        />

        <SummaryCard
          label="Failed Payments"
          value={failedCount}
          icon={XCircle}
          color="danger"
        />
      </div>

      {/* Transactions table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">
              Payment History
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              A record of payments made by your customers.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All methods</option>
              <option value="M-Pesa">M-Pesa</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[var(--bg-muted)]">
              <tr className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                <th className="px-5 py-3">Transaction</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Package</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Payment Method</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {filteredTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="text-sm text-[var(--text-primary)] transition hover:bg-[var(--bg-muted)]"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium">{transaction.receipt}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {transaction.time}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    {transaction.phone}
                  </td>

                  <td className="px-5 py-4">
                    {transaction.package}
                  </td>

                  <td className="px-5 py-4 font-semibold">
                    KES {transaction.amount.toLocaleString()}
                  </td>

                  <td className="px-5 py-4 text-[var(--text-secondary)]">
                    {transaction.method}
                  </td>

                  <td className="px-5 py-4 text-[var(--text-secondary)]">
                    {transaction.date}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={transaction.status} />
                  </td>

                  <td className="px-5 py-4">
                    <button
                      title="View transaction details"
                      className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                    >
                      <Eye size={17} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-12 text-center text-sm text-[var(--text-secondary)]"
                  >
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--border)] px-5 py-3">
          <p className="text-xs text-[var(--text-muted)]">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color = 'primary' }) {
  const colors = {
    primary: 'bg-[var(--primary-soft)] text-[var(--primary)]',
    success: 'bg-[var(--success)]/10 text-[var(--success)]',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    danger: 'bg-[var(--danger)]/10 text-[var(--danger)]',
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        <div className={`rounded-lg p-2 ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Completed: 'bg-[var(--success)]/10 text-[var(--success)]',
    Pending: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    Failed: 'bg-[var(--danger)]/10 text-[var(--danger)]',
  };

  const icons = {
    Completed: CheckCircle2,
    Pending: Clock,
    Failed: XCircle,
  };

  const Icon = icons[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      <Icon size={13} />
      {status}
    </span>
  );
}
