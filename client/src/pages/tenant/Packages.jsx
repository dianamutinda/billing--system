
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import {
  Plus,
  Search,
  Pencil,
  Wifi,
  MoreVertical,
  CheckCircle2,
  XCircle,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

import Select from '../../components/ui/Select';

import {
  listPackages,
  createPackage,
  updatePackage,
  toMinutes,
  splitMinutes,
} from '../../api/packages.js';

const emptyForm = {
  name: '',
  price: '',
  durationValue: '',
  durationUnit: 'hours',
};

export default function TenantPackages() {
  const [packages, setPackages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState(null);

  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [openMenu, setOpenMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);

  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);

  function closeMenu() {
    setOpenMenu(null);
    setMenuPosition(null);
  }

  function handleApiFailure(r) {
    if (r.status === 401) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    setError(
      `${r.status}: ${r.data?.error || 'Something went wrong'}`
    );
  }

  async function load() {
    setLoading(true);

    try {
      const r = await listPackages();

      if (r.ok) {
        setPackages(r.data);
        setError('');
      } else {
        handleApiFailure(r);
      }
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Close the menu when clicking outside it or scrolling.
  useEffect(() => {
    if (!openMenu) return;

    function handleOutsideClick(event) {
      const clickedMenu = menuRef.current?.contains(event.target);
      const clickedButton = menuButtonRef.current?.contains(event.target);

      if (!clickedMenu && !clickedButton) {
        closeMenu();
      }
    }

    function handleScroll() {
      closeMenu();
    }

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [openMenu]);

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

  const inactiveCount = packages.length - activeCount;

  function toggleMenu(pkgId, event) {
    if (openMenu === pkgId) {
      closeMenu();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const menuHeight = 88;
    const menuWidth = 192;
    const gap = 4;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < menuHeight + gap + 8;

    const preferredTop = openUpwards
      ? rect.top - menuHeight - gap
      : rect.bottom + gap;

    const top = Math.max(
      8,
      Math.min(preferredTop, window.innerHeight - menuHeight - 8)
    );

    const left = Math.max(
      8,
      Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)
    );

    menuButtonRef.current = event.currentTarget;

    setMenuPosition({ top, left });
    setOpenMenu(pkgId);
  }

  function openAddForm() {
    closeMenu();
    setEditingPackage(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  }

  function openEditForm(pkg) {
    const { value, unit } = splitMinutes(pkg.durationMinutes);

    closeMenu();

    setEditingPackage(pkg);

    setForm({
      name: pkg.name,
      price: String(pkg.price),
      durationValue: String(value),
      durationUnit: unit,
    });

    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingPackage(null);
    setForm(emptyForm);
  }

  function handleFormChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const price = Number(form.price);

    const durationMinutes = toMinutes(
      form.durationValue,
      form.durationUnit
    );

    if (
      !form.name.trim() ||
      !Number.isInteger(price) ||
      price < 1 ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1
    ) {
      setError(
        'Enter a package name, a valid price in whole shillings and a valid duration.'
      );
      return;
    }

    setSaving(true);
    setError('');

    const fields = {
      name: form.name.trim(),
      price,
      durationMinutes,
    };

    try {
      const r = editingPackage
        ? await updatePackage(editingPackage.id, fields)
        : await createPackage(fields);

      if (!r.ok) {
        handleApiFailure(r);
        return;
      }

      closeForm();
      await load();
    } catch {
      setError('Unable to save the package. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(pkg) {
    closeMenu();
    setError('');

    setStatusSavingId(pkg.id);

    // An inactive package should be activated.
    // An active package should be deactivated.
    const nextActive = pkg.status !== 'Active';

    try {
      const r = await updatePackage(pkg.id, {
        active: nextActive,
      });

      if (!r.ok) {
        handleApiFailure(r);
        return;
      }

      await load();
    } catch {
      setError('Unable to update package status. Please try again.');
    } finally {
      setStatusSavingId(null);
    }
  }

  const selectedPackage = packages.find(
    (pkg) => pkg.id === openMenu
  );

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
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)]"
        >
          <Plus size={18} />
          Add Package
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

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
          label="Hidden Packages"
          value={inactiveCount}
          icon={XCircle}
        />
      </div>

      {/* Packages table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">

        {/* Search and filters */}
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
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] placeholder:text-[var(--text-muted)] sm:w-56"
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-[var(--bg-muted)]">
              <tr className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                <th className="px-5 py-3">Package</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Duration</th>
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
                    KES {Number(pkg.price).toLocaleString('en-KE')}
                  </td>

                  <td className="px-5 py-4 text-[var(--text-secondary)]">
                    {pkg.duration}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={pkg.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <button
                        ref={openMenu === pkg.id ? menuButtonRef : null}
                        type="button"
                        title="Package actions"
                        aria-label={`Actions for ${pkg.name}`}
                        aria-expanded={openMenu === pkg.id}
                        disabled={statusSavingId === pkg.id}
                        onClick={(e) => toggleMenu(pkg.id, e)}
                        className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] disabled:opacity-50"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPackages.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-12 text-center text-sm text-[var(--text-secondary)]"
                  >
                    {loading
                      ? 'Loading packages...'
                      : 'No packages found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="border-t border-[var(--border)] px-5 py-3">
          <p className="text-xs text-[var(--text-muted)]">
            Showing {filteredPackages.length} of {packages.length} packages
          </p>
        </div>
      </div>

      {/* Dropdown rendered outside the table */}
      {openMenu && menuPosition && selectedPackage &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] w-48 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-1 shadow-lg"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            <button
              type="button"
              onClick={() => openEditForm(selectedPackage)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--bg-muted)]"
            >
              <Pencil size={15} />
              Edit package
            </button>

            <button
              type="button"
              disabled={statusSavingId === selectedPackage.id}
              onClick={() => toggleStatus(selectedPackage)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--bg-muted)] disabled:opacity-50"
            >
              {selectedPackage.status === 'Active' ? (
                <ToggleLeft size={16} />
              ) : (
                <ToggleRight size={16} />
              )}

              {selectedPackage.status === 'Active'
                ? 'Deactivate'
                : 'Activate'}
            </button>
          </div>,
          document.body
        )}

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
              <div className="flex gap-2">
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={form.durationValue}
                  onChange={(e) =>
                    handleFormChange('durationValue', e.target.value)
                  }
                  placeholder="e.g. 1"
                  className="form-input min-w-0 flex-1"
                />

                <Select
                  value={form.durationUnit}
                  onChange={(value) =>
                    handleFormChange('durationUnit', value)
                  }
                  width="w-40"
                  options={[
                    { label: 'Minutes', value: 'minutes' },
                    { label: 'Hours', value: 'hours' },
                    { label: 'Days', value: 'days' },
                  ]}
                />
              </div>
            </FormField>

            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editingPackage
                    ? 'Save Changes'
                    : 'Create Package'}
              </button>
            </div>
          </form>
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
