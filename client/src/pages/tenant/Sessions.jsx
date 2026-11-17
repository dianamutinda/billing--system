
import { useState } from 'react';
import {
  Search,
  Wifi,
  Clock,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Timer,
  MoreVertical,
} from 'lucide-react';

const initialSessions = [
  {
    id: 1,
    phone: '0712345678',
    package: '1 Hour Package',
    ip: '192.168.88.101',
    mac: 'A4:5E:60:12:34:56',
    started: '10:30 AM',
    expires: '11:30 AM',
    status: 'Active',
  },
  {
    id: 2,
    phone: '0723456789',
    package: 'Daily Package',
    ip: '192.168.88.102',
    mac: 'B8:27:EB:45:67:89',
    started: '09:15 AM',
    expires: '09:15 AM tomorrow',
    status: 'Active',
  },
  {
    id: 3,
    phone: '0709876543',
    package: '1 Hour Package',
    ip: '192.168.88.103',
    mac: 'C0:25:E9:78:90:12',
    started: '08:00 AM',
    expires: '09:00 AM',
    status: 'Expired',
  },
  {
    id: 4,
    phone: '0798765432',
    package: 'Weekly Package',
    ip: '192.168.88.104',
    mac: 'D4:6A:6A:23:45:67',
    started: 'Yesterday, 2:00 PM',
    expires: 'Next week',
    status: 'Active',
  },
  {
    id: 5,
    phone: '0756789012',
    package: '1 Hour Package',
    ip: '192.168.88.105',
    mac: 'E8:9F:80:34:56:78',
    started: '07:30 AM',
    expires: '08:30 AM',
    status: 'Disconnected',
  },
];

export default function TenantSessions() {
  const [sessions] = useState(initialSessions);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const activeCount = sessions.filter(
    (session) => session.status === 'Active'
  ).length;

  const expiredCount = sessions.filter(
    (session) => session.status === 'Expired'
  ).length;

  const disconnectedCount = sessions.filter(
    (session) => session.status === 'Disconnected'
  ).length;

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.phone.includes(search) ||
      session.package.toLowerCase().includes(search.toLowerCase()) ||
      session.ip.includes(search);

    const matchesStatus =
      statusFilter === 'All' || session.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Sessions
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Monitor customer connections and manage active internet sessions.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Sessions"
          value={sessions.length}
          icon={Users}
        />

        <SummaryCard
          label="Active Sessions"
          value={activeCount}
          icon={Wifi}
          color="success"
        />

        <SummaryCard
          label="Expired Sessions"
          value={expiredCount}
          icon={Clock}
          color="warning"
        />

        <SummaryCard
          label="Disconnected"
          value={disconnectedCount}
          icon={Activity}
          color="danger"
        />
      </div>

      {/* Sessions table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">
              All Sessions
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              View customer connection details and session status.
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
                placeholder="Search phone, package, IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Disconnected">Disconnected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[var(--bg-muted)]">
              <tr className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Package</th>
                <th className="px-5 py-3">IP Address</th>
                <th className="px-5 py-3">Started</th>
                <th className="px-5 py-3">Expires</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {filteredSessions.map((session) => (
                <tr
                  key={session.id}
                  className="text-sm text-[var(--text-primary)] transition hover:bg-[var(--bg-muted)]"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium">{session.phone}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {session.mac}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    {session.package}
                  </td>

                  <td className="px-5 py-4 font-mono text-xs text-[var(--text-secondary)]">
                    {session.ip}
                  </td>

                  <td className="px-5 py-4 text-[var(--text-secondary)]">
                    {session.started}
                  </td>

                  <td className="px-5 py-4 text-[var(--text-secondary)]">
                    {session.expires}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={session.status} />
                  </td>

                  <td className="px-5 py-4">
                    <button
                      title="More session actions"
                      className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                    >
                      <MoreVertical size={17} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredSessions.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-sm text-[var(--text-secondary)]"
                  >
                    No sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--border)] px-5 py-3">
          <p className="text-xs text-[var(--text-muted)]">
            Showing {filteredSessions.length} of {sessions.length} sessions
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
    Active: 'bg-[var(--success)]/10 text-[var(--success)]',
    Expired: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    Disconnected: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status === 'Active' ? (
        <CheckCircle2 size={13} />
      ) : status === 'Expired' ? (
        <Timer size={13} />
      ) : (
        <XCircle size={13} />
      )}
      {status}
    </span>
  );
}
