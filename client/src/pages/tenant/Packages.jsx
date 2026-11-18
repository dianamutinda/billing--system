
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
  X,
  ToggleLeft,
  ToggleRight,
  Package,
} from 'lucide-react';

import Select from '../../components/ui/Select';

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

const emptyForm = {
  name: '',
  price: '',
  duration: '',
  devices: '1',
  status: 'Active',
};

export default function TenantPackages() {
  const [packages, setPackages] = useState(initialPackages);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [openMenu, setOpenMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const openAddForm = () => {
    setEditingPackage(null);
    setForm(emptyForm);
    setShowForm(true);
    setOpenMenu(null);
  };

  const openEditForm = (pkg) => {
    setEditingPackage(pkg);
    setForm({
      name: pkg.name,
      price: String(pkg.price),
      duration: pkg.duration,
      devices: String(pkg.devices),
      status: pkg.status,
    });
    setShowForm(true);
    setOpenMenu(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPackage(null);
    setForm(emptyForm);
  };

  const handleFormChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const price = Number(form.price);
    const devices = Number(form.devices);

    if (
      !form.name.trim() ||
      !form.duration.trim() ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(devices) ||
      devices < 1
    ) {
      return;
    }

    if (editingPackage) {
      setPackages((current) =>
        current.map((pkg) =>
          pkg.id === editingPackage.id
            ? {
                ...pkg,
                name: form.name.trim(),
                price,
                duration: form.duration.trim(),
                devices,
                status: form.status,
              }
            : pkg
        )
      );
    } else {
      const newPackage = {
        id: Date.now(),
        name: form.name.trim(),
        price,
        duration: form.duration.trim(),
        devices,
        status: form.status,
        sales: 0,
      };

      setPackages((current) => [newPackage, ...current]);
    }

    closeForm();
  };

  const toggleStatus = (id) => {
    setPackages((current) =>
      current.map((pkg) =>
        pkg.id === id
          ? {
              ...pkg,
              status:
                pkg.status === 'Active' ? 'Inactive' : 'Active',
            }
          : pkg
      )
    );

    setOpenMenu(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    setPackages((current) =>
      current.filter((pkg) => pkg.id !== deleteTarget.id)
    );

    setDeleteTarget(null);
    setOpenMenu(null);
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
          type="button"
          onClick={openAddForm}
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
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] sm:w-56"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              width="w-full sm:w-40"
              options={[
                { label: 'All statuses', value: 'All' },
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
              ]}
            />
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
                <th className="px-5 py-3 text-right">Actions</th>
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
                    <StatusBadge status={pkg.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="relative flex justify-end">
                      <button
                        type="button"
                        title="Package actions"
                        aria-label={`Actions for ${pkg.name}`}
                        aria-expanded={openMenu === pkg.id}
                        onClick={() =>
                          setOpenMenu((current) =>
                            current === pkg.id ? null : pkg.id
                          )
                        }
                        className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenu === pkg.id && (
                        <div className="absolute right-8 top-0 z-20 w-48 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => openEditForm(pkg)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--bg-muted)]"
                          >
                            <Pencil size={15} />
                            Edit package
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleStatus(pkg.id)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--bg-muted)]"
                          >
                            {pkg.status === 'Active' ? (
                              <ToggleLeft size={16} />
                            ) : (
                              <ToggleRight size={16} />
                            )}
                            {pkg.status === 'Active'
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>

                          <div className="my-1 border-t border-[var(--border)]" />

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget(pkg);
                              setOpenMenu(null);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--danger)] transition hover:bg-[var(--danger)]/10"
                          >
                            <Trash2 size={15} />
                            Delete package
                          </button>
                        </div>
                      )}
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

      {/* Add / Edit modal */}
      {showForm && (
        <Modal onClose={closeForm}>
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {editingPackage ? 'Edit Package' : 'Add Package'}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {editingPackage
                  ? 'Update the details of this internet package.'
                  : 'Create an internet package for your customers.'}
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Package name">
              <input
                required
                value={form.name}
                onChange={(e) =>
                  handleFormChange('name', e.target.value)
                }
                placeholder="e.g. 1 Hour Package"
                className="form-input"
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Price (KES)">
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={form.price}
                  onChange={(e) =>
                    handleFormChange('price', e.target.value)
                  }
                  placeholder="e.g. 20"
                  className="form-input"
                />
              </FormField>

              <FormField label="Duration">
                <input
                  required
                  value={form.duration}
                  onChange={(e) =>
                    handleFormChange('duration', e.target.value)
                  }
                  placeholder="e.g. 1 hour"
                  className="form-input"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Device limit">
                <Select
                  value={form.devices}
                  onChange={(value) =>
                    handleFormChange('devices', value)
                  }
                  width="w-full"
                  options={[
                    { label: '1 device', value: '1' },
                    { label: '2 devices', value: '2' },
                    { label: '3 devices', value: '3' },
                    { label: '5 devices', value: '5' },
                  ]}
                />
              </FormField>

              <FormField label="Status">
                <Select
                  value={form.status}
                  onChange={(value) =>
                    handleFormChange('status', value)
                  }
                  width="w-full"
                  options={[
                    { label: 'Active', value: 'Active' },
                    { label: 'Inactive', value: 'Inactive' },
                  ]}
                />
              </FormField>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                {editingPackage ? 'Save Changes' : 'Create Package'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-[var(--danger)]/10 p-3">
              <Trash2 size={20} className="text-[var(--danger)]" />
            </div>

            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                Delete package?
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Are you sure you want to delete{' '}
                <span className="font-medium text-[var(--text-primary)]">
                  {deleteTarget.name}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={confirmDelete}
              className="rounded-lg bg-[var(--danger)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Delete Package
            </button>
          </div>
        </Modal>
      )}
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

function StatusBadge({ status }) {
  const active = status === 'Active';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? 'bg-[var(--success)]/10 text-[var(--success)]'
          : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
      }`}
    >
      {active ? (
        <CheckCircle2 size={13} />
      ) : (
        <XCircle size={13} />
      )}
      {status}
    </span>
  );
}

function FormField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>
      {children}
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
