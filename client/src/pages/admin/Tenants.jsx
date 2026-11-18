
import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Building2,
  CheckCircle2,
  Clock3,
  Ban,
  Search,
  Plus,
  Wifi,
  WifiOff,
  Eye,
} from 'lucide-react';

import DropdownMenu from '../../components/ui/DropdownMenu';
import Select from '../../components/ui/Select';


const initialTenants = [
  {
    id: 1,
    name: "Joe's Wi-Fi",
    email: 'joe@example.com',
    phone: '+254 712 345 678',
    location: 'Westlands, Nairobi',
    plan: 'Professional',
    registered: '01 Nov 2026',
    status: 'Active',
    routerStatus: 'Connected',
  },
  {
    id: 2,
    name: 'Metro Hotspot',
    email: 'metro@example.com',
    phone: '+254 722 456 789',
    location: 'CBD, Nairobi',
    plan: 'Starter',
    registered: '05 Nov 2026',
    status: 'Active',
    routerStatus: 'Connected',
  },
  {
    id: 3,
    name: 'FastLink Networks',
    email: 'fastlink@example.com',
    phone: '+254 733 567 890',
    location: 'Kilimani, Nairobi',
    plan: 'Business',
    registered: '10 Nov 2026',
    status: 'Active',
    routerStatus: 'Disconnected',
  },
  {
    id: 4,
    name: 'City Connect',
    email: 'city@example.com',
    phone: '+254 744 678 901',
    location: 'Thika, Kiambu',
    plan: 'Starter',
    registered: '12 Nov 2026',
    status: 'Pending',
    routerStatus: 'Not configured',
  },
  {
    id: 5,
    name: 'SkyNet Wi-Fi',
    email: 'skynet@example.com',
    phone: '+254 755 789 012',
    location: 'Rongai, Kajiado',
    plan: 'Professional',
    registered: '15 Oct 2026',
    status: 'Suspended',
    routerStatus: 'Disconnected',
  },
  {
    id: 6,
    name: 'Connect Plus',
    email: 'connect@example.com',
    phone: '+254 766 890 123',
    location: 'Machakos Town',
    plan: 'Starter',
    registered: '16 Nov 2026',
    status: 'Active',
    routerStatus: 'Connected',
  },
];

function StatusBadge({ status }) {
  const styles = {
    Active: 'bg-[var(--primary-soft)] text-[var(--success)]',
    Pending: 'bg-[var(--bg-muted)] text-[var(--warning)]',
    Suspended: 'bg-[var(--bg-muted)] text-[var(--danger)]',
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
  const connected = status === 'Connected';
  const notConfigured = status === 'Not configured';

  return (
    <div className="flex items-center gap-2">
      {connected ? (
        <Wifi size={15} className="text-[var(--success)]" />
      ) : (
        <WifiOff
          size={15}
          className={
            notConfigured
              ? 'text-[var(--text-muted)]'
              : 'text-[var(--warning)]'
          }
        />
      )}

      <span className="text-xs text-[var(--text-secondary)]">
        {status}
      </span>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, description }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            {label}
          </p>

          <h3 className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
            {value}
          </h3>
        </div>

        <div className="rounded-lg bg-[var(--primary-soft)] p-3">
          <Icon size={20} className="text-[var(--primary)]" />
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        {description}
      </p>
    </div>
  );
}

export default function AdminTenants() {
  const [tenants, setTenants] = useState(initialTenants);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [selectedTenant, setSelectedTenant] = useState(null);

  const activeCount = tenants.filter(
    (tenant) => tenant.status === 'Active'
  ).length;

  const pendingCount = tenants.filter(
    (tenant) => tenant.status === 'Pending'
  ).length;

  const suspendedCount = tenants.filter(
    (tenant) => tenant.status === 'Suspended'
  ).length;

  const filteredTenants = tenants.filter((tenant) => {
    const searchTerm = search.toLowerCase();

    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm) ||
      tenant.email.toLowerCase().includes(searchTerm) ||
      tenant.location.toLowerCase().includes(searchTerm);

    const matchesStatus =
      statusFilter === 'All' || tenant.status === statusFilter;

    const matchesPlan =
      planFilter === 'All' || tenant.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  function updateTenantStatus(id, newStatus) {
    setTenants((current) =>
      current.map((tenant) =>
        tenant.id === id
          ? { ...tenant, status: newStatus }
          : tenant
      )
    );

    setSelectedTenant((current) =>
      current?.id === id
        ? { ...current, status: newStatus }
        : current
    );
  }

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

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Tenants"
          value={tenants.length}
          icon={Building2}
          description="All registered businesses"
        />

        <SummaryCard
          label="Active Tenants"
          value={activeCount}
          icon={CheckCircle2}
          description="Accounts currently active"
        />

        <SummaryCard
          label="Pending Tenants"
          value={pendingCount}
          icon={Clock3}
          description="Awaiting activation"
        />

        <SummaryCard
          label="Suspended Tenants"
          value={suspendedCount}
          icon={Ban}
          description="Accounts currently suspended"
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
              View and manage tenant accounts.
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
    { label: 'Suspended', value: 'Suspended' },
  ]}
/>

            <Select
  value={planFilter}
  onChange={setPlanFilter}
  width="w-full sm:w-40"
  options={[
    { label: 'All plans', value: 'All' },
    { label: 'Starter', value: 'Starter' },
    { label: 'Professional', value: 'Professional' },
    { label: 'Business', value: 'Business' },
  ]}
/>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                <th className="px-5 py-4 font-medium">Business</th>
                <th className="px-5 py-4 font-medium">Location</th>
                <th className="px-5 py-4 font-medium">Plan</th>
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
                    {tenant.location}
                  </td>

                  <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                    {tenant.plan}
                  </td>

                  <td className="px-5 py-4">
                    <RouterStatus status={tenant.routerStatus} />
                  </td>

                  <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                    {tenant.registered}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={tenant.status} />
                  </td>

                  {/* Reusable dropdown */}
                  <td className="px-5 py-4">
                    <DropdownMenu
                      items={[
                        {
                          label: 'View details',
                          icon: Eye,
                          onClick: () => setSelectedTenant(tenant),
                        },
                        ...(tenant.status !== 'Active'
                          ? [
                              {
                                label: 'Activate account',
                                icon: CheckCircle2,
                                onClick: () =>
                                  updateTenantStatus(tenant.id, 'Active'),
                              },
                            ]
                          : [
                              {
                                label: 'Suspend account',
                                icon: Ban,
                                danger: true,
                                onClick: () =>
                                  updateTenantStatus(
                                    tenant.id,
                                    'Suspended'
                                  ),
                              },
                            ]),
                      ]}
                    />
                  </td>
                </tr>
              ))}

              {filteredTenants.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-sm text-[var(--text-muted)]"
                  >
                    No businesses match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--border)] px-5 py-4">
          <p className="text-xs text-[var(--text-muted)]">
            Showing {filteredTenants.length} of {tenants.length} businesses
          </p>
        </div>
      </section>

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
                ['Phone', selectedTenant.phone],
                ['Location', selectedTenant.location],
                ['Subscription plan', selectedTenant.plan],
                ['Registration date', selectedTenant.registered],
                ['Router connection', selectedTenant.routerStatus],
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

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedTenant(null)}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
              >
                Close
              </button>

              {selectedTenant.status !== 'Active' && (
                <button
                  type="button"
                  onClick={() => {
                    updateTenantStatus(selectedTenant.id, 'Active');
                  }}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
                >
                  Activate tenant
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
