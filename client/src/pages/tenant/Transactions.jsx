import { useEffect, useState } from 'react';
import {
  Search,
  ReceiptText,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  Eye,
  X,
  Smartphone,
  Package,
  CalendarDays,
} from 'lucide-react';

import Select from '../../components/ui/Select';
import { listTransactions } from '../../api/transactions.js';

export default function TenantTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    (async () => {
      const r = await listTransactions();
      if (r.ok) setTransactions(r.data);
      else setError(r.data?.error || 'Could not load transactions.');
      setLoading(false);
    })();
  }, []);

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
    const query = search.toLowerCase().trim();

    const matchesSearch =
      transaction.phone.includes(query) ||
      transaction.receipt.toLowerCase().includes(query) ||
      transaction.package.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'All' || transaction.status === statusFilter;

    const matchesMethod =
      methodFilter === 'All' || transaction.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const downloadReceipt = (transaction) => {
    const receiptContent = `
PAYMENT RECEIPT
------------------------------
Receipt: ${transaction.receipt}
Customer: ${transaction.phone}
Package: ${transaction.package}
Amount: KES ${transaction.amount.toLocaleString()}
Payment Method: ${transaction.method}
Date: ${transaction.date}
Time: ${transaction.time}
Status: ${transaction.status}
------------------------------
Thank you for your purchase.
`;

    const blob = new Blob([receiptContent], {
      type: 'text/plain;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `receipt-${transaction.receipt}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

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

      {loading && (
        <p className="text-sm text-[var(--text-secondary)]">
          Loading transactions...
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

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
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] sm:w-56"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              width="w-full sm:w-40"
              options={[
                { label: 'All statuses', value: 'All' },
                { label: 'Completed', value: 'Completed' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Failed', value: 'Failed' },
                { label: 'Review', value: 'Review' },
              ]}
            />

            <Select
              value={methodFilter}
              onChange={setMethodFilter}
              width="w-full sm:w-40"
              options={[
                { label: 'All methods', value: 'All' },
                { label: 'M-Pesa', value: 'M-Pesa' },
              ]}
            />
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
                      type="button"
                      title="View transaction details"
                      onClick={() => setSelectedTransaction(transaction)}
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

      {/* Transaction details modal */}
      {selectedTransaction && (
        <Modal onClose={() => setSelectedTransaction(null)}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Transaction Details
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Payment information and receipt details.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTransaction(null)}
              className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
            >
              <X size={19} />
            </button>
          </div>

          <div className="mt-6 rounded-xl bg-[var(--bg-muted)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Transaction amount
            </p>

            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
              KES {selectedTransaction.amount.toLocaleString()}
            </p>

            <div className="mt-3">
              <StatusBadge status={selectedTransaction.status} />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <DetailRow
              icon={ReceiptText}
              label="Receipt number"
              value={selectedTransaction.receipt}
            />

            <DetailRow
              icon={Smartphone}
              label="Customer phone"
              value={selectedTransaction.phone}
            />

            <DetailRow
              icon={Package}
              label="Package"
              value={selectedTransaction.package}
            />

            <DetailRow
              icon={Wallet}
              label="Payment method"
              value={selectedTransaction.method}
            />

            <DetailRow
              icon={CalendarDays}
              label="Date and time"
              value={`${selectedTransaction.date}, ${selectedTransaction.time}`}
            />

            {selectedTransaction.note && (
              <DetailRow
                icon={AlertTriangle}
                label="Status note"
                value={selectedTransaction.note}
              />
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setSelectedTransaction(null)}
              className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => downloadReceipt(selectedTransaction)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Download size={16} />
              Download Receipt
            </button>
          </div>
        </Modal>
      )}
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
    Review: 'bg-[var(--warning)]/10 text-[var(--warning)]',
  };

  const icons = {
    Completed: CheckCircle2,
    Pending: Clock,
    Failed: XCircle,
    Review: AlertTriangle,
  };

  const Icon = icons[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || ''}`}
    >
      {Icon && <Icon size={13} />}
      {status}
    </span>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-[var(--bg-muted)] p-2">
        <Icon size={17} className="text-[var(--text-secondary)]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-[var(--text-primary)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-xl">
        {children}
      </div>
    </div>
  );
}