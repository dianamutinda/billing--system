
import { useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Clock,
  Wifi,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const initialPackages = [
  {
    id: 1,
    name: '1 Hour Package',
    price: 20,
    duration: '1 hour',
    devices: 1,
    status: 'Active',
    sales: 86,
  },
  {
    id: 2,
    name: 'Daily Package',
    price: 100,
    duration: '24 hours',
    devices: 2,
    status: 'Active',
    sales: 42,
  },
  {
    id: 3,
    name: 'Weekly Package',
    price: 350,
    duration: '7 days',
    devices: 2,
    status: 'Active',
    sales: 18,
  },
  {
    id: 4,
    name: 'Monthly Package',
    price: 1000,
    duration: '30 days',
    devices: 3,
    status: 'Inactive',
    sales: 5,
  },
];

export default function TenantPackages() {
  const [packages, setPackages] = useState(initialPackages);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || pkg.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = packages.filter(
    (pkg) => pkg.status === 'Active'
  ).length;

  const totalSales = packages.reduce(
    (total, pkg) => total + pkg.sales,
    0
  );

  const toggleStatus = (id) => {
    setPackages((current) =>
      current.map((pkg) =>
        pkg.id === id
          ? {
              ...pkg,
              status: pkg.status === 'Active' ? 'Inactive' : 'Active',
            }
          : pkg
      )
    );
  };

  const deletePackage = (id) => {
    setPackages((current) =>
      current.filter((pkg) => pkg.id !== id)
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Packages
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Create and manage the internet packages available to your customers.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus size={18} />
          Add Package
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Packages"
          value={packages.length}
          icon={Wifi}
        />
        <SummaryCard
          label="Active Packages"
          value={activeCount}
          icon={CheckCircle2}
        />
        <SummaryCard
          label="Total Purchases"
          value={totalSales}
          icon={Clock}
        />
      </div>

      {/* Packages table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">
              All Packages
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Manage your available internet plans.
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
                placeholder="Search packages..."
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
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead className="bg-[var(--bg-muted)]">
              <tr className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                <th className="px-5 py-3">Package</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Devices</th>
                <th className="px-5 py-3">Purchases</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {filteredPackages.map((pkg) => (
                <tr
                  key={pkg.id}
                  className="text-sm text-[var(--text-primary)] transition hover:bg-[var(--bg-muted)]"
                >
                  <td className="px-5 py-4 font-medium">
                    {pkg.name}
                  </td>

                  <td className="px-5 py-4 font-medium">
                    KES {pkg.price.toLocaleString()}
                  </td>

                  <td className="px-5 py-4 text-[var(--text-secondary)]">
                    {pkg.duration}
                  </td>

                  <td className="px-5 py-4">
                    {pkg.devices}
                  </td>

                  <td className="px-5 py-4">
                    {pkg.sales}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        pkg.status === 'Active'
                          ? 'bg-[var(--success)]/10 text-[var(--success)]'
                          : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                      }`}
                    >
                      {pkg.status === 'Active' ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <XCircle size={13} />
                      )}
                      {pkg.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        title="Edit package"
                        className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        title="Toggle package status"
                        onClick={() => toggleStatus(pkg.id)}
                        className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                      >
                        <MoreVertical size={16} />
                      </button>

                      <button
                        title="Delete package"
                        onClick={() => deletePackage(pkg.id)}
                        className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPackages.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-sm text-[var(--text-secondary)]"
                  >
                    No packages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--border)] px-5 py-3">
          <p className="text-xs text-[var(--text-muted)]">
            Showing {filteredPackages.length} of {packages.length} packages
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          {label}
        </p>
        <div className="rounded-lg bg-[var(--primary-soft)] p-2">
          <Icon size={18} className="text-[var(--primary)]" />
        </div>
      </div>

      <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}
