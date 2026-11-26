import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Search,
  Plus,
  Wifi,
  WifiOff,
  Eye,
} from 'lucide-react';

import DropdownMenu from '../../components/ui/DropdownMenu';
import Select from '../../components/ui/Select';
import { listTenants } from '../../api/admin.js';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Nairobi',
  });
}

function StatusBadge({ status }) {
  const styles = {
    Active: 'bg-[var(--primary-soft)] text-[var(--success)]',
    Pending: 'bg-[var(--bg-muted)] text-[var(--warning)]',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || 'bg-[var(--bg-muted)] text-[var(--text-secondary)]'
      }`}
    >
      {status}
    </span>
  );
}

function RouterStatus({ status }) {
  const configured = status === 'Configured';

  return (
    <div className="flex items-center gap-2">
      {configured ? (
        <Wifi size={15} className="text-[var(--success)]" />
      ) : (
        <WifiOff size={15} className="text-[var(--text-muted)]" />
      )}

      <span className="text-xs text-[var(--text-secondary)]">{status}</span>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, description }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>

          <h3 className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
            {value}
          </h3>
        </div>

        <div className="rounded-lg bg-[var(--primary-soft)] p-3">
          <Icon size={20} className="text-[var(--primary)]" />
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)]">{description}</p>
    </div>
  );
}

export default function AdminTenants() {
  const [tenants, setTenants] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const r = await listTenants();
      if (cancelled) return;
      if (r.ok) setTenants(r.data);
      else setError(r.error || 'Could not load tenants');
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const list = tenants || [];
  const activeCount = list.filter((t) => t.status === 'Active').length;
  const pendingCount = list.filter((t) => t.status === 'Pending').length;
  const routerCount = list.filter((t) => t.routerStatus === 'Configured').length;

  const filteredTenants = list.filter((tenant) => {
    const term = search.toLowerCase();

    const matchesSearch =
      tenant.name.toLowerCase().includes(term) ||
      tenant.email.toLowerCase().includes(term) ||
      tenant.location.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'All' || tenant.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Tenants
          </h1>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage registered hotspot businesses on your platform.
          </p>
        </div>

        <Link
          to="/admin/tenants/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
        >
          <Plus size={16} />
          Add tenant
        </Link>
      </div>

      {error && (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
          {error}
        </p>
      )}

      {!tenants && !error && (
        <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
      )}

      {tenants && (
        <>
          {/* Summary cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total Tenants"
              value={list.length}
              icon={Building2}
              description="All registered businesses"
            />

            <SummaryCard
              label="Active Tenants"
              value={activeCount}
              icon={CheckCircle2}
              description="Have set their own password"
            />

            <SummaryCard
              label="Pending Tenants"
              value={pendingCount}
              icon={Clock3}
              description="Still on a temporary password"
            />

            <SummaryCard
              label="Routers Configured"
              value={routerCount}
              icon={Wifi}
              description="Router details have been added"
            />
          </section>

          {/* Tenant table */}
          <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
            {/* Filters */}
            <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Registered Businesses
                </h2>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  View tenant accounts.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <div className="relative min-w-0">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  />

                  <input
                    type="text"
                    placeholder="Search businesses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] sm:w-60"
                  />
                </div>

                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  width="w-full sm:w-40"
                  options={[
                    { label: 'All statuses', value: 'All' },
                    { label: 'Active', value: 'Active' },
                    { label: 'Pending', value: 'Pending' },
                  ]}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                    <th className="px-5 py-4 font-medium">Business</th>
                    <th className="px-5 py-4 font-medium">Location</th>
                    <th className="px-5 py-4 font-medium">Router</th>
                    <th className="px-5 py-4 font-medium">Registered</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-muted)]/50"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {tenant.name}
                        </p>

                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {tenant.email}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                        {tenant.location || '—'}
                      </td>

                      <td className="px-5 py-4">
                        <RouterStatus status={tenant.routerStatus} />
                      </td>

                      <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                        {formatDate(tenant.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={tenant.status} />
                      </td>

                      <td className="px-5 py-4">
                        <DropdownMenu
                          items={[
                            {
                              label: 'View details',
                              icon: Eye,
                              onClick: () => setSelectedTenant(tenant),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}

                  {filteredTenants.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-5 py-12 text-center text-sm text-[var(--text-muted)]"
                      >
                        {list.length === 0
                          ? 'No tenants yet. Add your first tenant to get started.'
                          : 'No businesses match your filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-[var(--border)] px-5 py-4">
              <p className="text-xs text-[var(--text-muted)]">
                Showing {filteredTenants.length} of {list.length} businesses
              </p>
            </div>
          </section>
        </>
      )}

      {/* Tenant details modal */}
      {selectedTenant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedTenant(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tenant-details-title"
            className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="tenant-details-title"
                  className="text-lg font-semibold text-[var(--text-primary)]"
                >
                  Tenant Details
                </h2>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Business account information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTenant(null)}
                aria-label="Close details"
                className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
              >
                ×
              </button>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="rounded-xl bg-[var(--primary-soft)] p-3">
                <Building2 size={24} className="text-[var(--primary)]" />
              </div>

              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">
                  {selectedTenant.name}
                </h3>

                <StatusBadge status={selectedTenant.status} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {[
                ['Email', selectedTenant.email],
                ['Phone', selectedTenant.phone || '—'],
                ['Location', selectedTenant.location || '—'],
                ['Registration date', formatDate(selectedTenant.createdAt)],
                ['Router', selectedTenant.routerStatus],
                [
                  'M-Pesa payments',
                  selectedTenant.paymentsConfigured ? 'Configured' : 'Not configured',
                ],
                [
                  'Customer portal',
                  `${window.location.origin}/p/${selectedTenant.portalSlug}`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 border-b border-[var(--border)] pb-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm text-[var(--text-secondary)]">
                    {label}
                  </span>

                  <span className="break-all text-sm font-medium text-[var(--text-primary)] sm:text-right">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTenant(null)}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}