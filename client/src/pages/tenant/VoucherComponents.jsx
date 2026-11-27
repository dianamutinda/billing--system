import {
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Copy,
  Search,
  RefreshCw,
  X,
  Wifi,
  Download,
  Eye,
  AlertCircle,
} from 'lucide-react';

import Select from '../../components/ui/Select.jsx';

import {
  STATUSES,
  formatDate,
  getCleanupStatus,
} from './voucherHelpers.js';

function formatDuration(pkg) {
  if (!pkg) return '';
  if (pkg.duration) return pkg.duration;
  if (pkg.duration_label) return pkg.duration_label;
  if (pkg.duration_minutes) return `${pkg.duration_minutes} mins`;
  return '';
}

/* ---------------- Summary cards ---------------- */

export function SummaryCards({ stats }) {
  const cards = [
    {
      label: 'Total Vouchers',
      value: stats.total,
      icon: Ticket,
    },
    {
      label: 'Unused',
      value: stats.unused,
      icon: Clock,
    },
    {
      label: 'Active',
      value: stats.active,
      icon: CheckCircle2,
    },
    {
      label: 'Expired',
      value: stats.expired,
      icon: XCircle,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--text-secondary)]">
                {card.label}
              </p>

              <div className="rounded-lg bg-[var(--primary-soft)] p-2">
                <Icon
                  size={18}
                  className="text-[var(--primary)]"
                />
              </div>
            </div>

            <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Voucher list ---------------- */

export function VoucherList({
  vouchers,
  filteredVouchers,
  loading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  batchFilter,
  setBatchFilter,
  batches,
  stats,
  revokingId,
  onRefresh,
  onExport,
  onCopy,
  onView,
  onRevoke,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">

      {/* Header and filters */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">
              All Vouchers
            </h2>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              View and manage your generated access codes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={onExport}
              disabled={!filteredVouchers.length}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] disabled:opacity-50"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />

            <input
              type="text"
              placeholder="Search code, phone or MAC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            width="w-full"
            options={STATUSES}
          />

          <Select
            value={batchFilter}
            onChange={setBatchFilter}
            width="w-full"
            options={[
              { label: 'All batches', value: 'all' },
              ...batches.map((batch) => ({
                label: `Batch ${batch}`,
                value: String(batch),
              })),
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead className="bg-[var(--bg-muted)]">
            <tr className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
              <th className="px-5 py-3">Voucher</th>
              <th className="px-5 py-3">Package</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Expires</th>
              <th className="px-5 py-3">Router cleanup</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border)]">
            {filteredVouchers.map((voucher) => {
              const cleanup = getCleanupStatus(voucher);

              return (
                <tr
                  key={voucher.id}
                  className="text-sm text-[var(--text-primary)] transition hover:bg-[var(--bg-muted)]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold">
                          {voucher.code}
                        </p>

                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {voucher.batchId
                            ? `Batch ${voucher.batchId}`
                            : 'Individual voucher'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onCopy(voucher.code)}
                        title="Copy voucher code"
                        className="rounded-md p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium">
                      {voucher.packageName}
                    </p>

                    {voucher.phoneNumber && (
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {voucher.phoneNumber}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={voucher.status} />
                  </td>

                  <td className="px-5 py-4 text-[var(--text-secondary)]">
                    {formatDate(voucher.expiresAt)}
                  </td>

                  <td className="px-5 py-4">
                    <CleanupBadge cleanup={cleanup} />

                    {voucher.revokeAttempts > 0 && (
                      <p
                        title={voucher.revokeError || ''}
                        className="mt-1 text-xs text-[var(--text-muted)]"
                      >
                        {voucher.revokeAttempts} attempts
                        {voucher.revokeError ? ' · Error' : ''}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="View details"
                        onClick={() => onView(voucher)}
                        className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                      >
                        <Eye size={17} />
                      </button>

                      {voucher.status !== 'revoked' && (
                        <button
                          type="button"
                          title="Revoke voucher"
                          disabled={revokingId === voucher.id}
                          onClick={() => onRevoke(voucher)}
                          className="rounded-md p-2 text-[var(--danger)] transition hover:bg-[var(--danger)]/10 disabled:opacity-50"
                        >
                          {revokingId === voucher.id ? (
                            <RefreshCw
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Ban size={17} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!loading && filteredVouchers.length === 0 && (
              <tr>
                <td colSpan="6" className="px-5 py-14 text-center">
                  <Ticket
                    size={30}
                    className="mx-auto mb-3 text-[var(--text-muted)]"
                  />

                  <p className="font-medium text-[var(--text-primary)]">
                    No vouchers found
                  </p>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {vouchers.length
                      ? 'Try changing your search or filters.'
                      : 'Generate your first voucher batch to get started.'}
                  </p>
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td
                  colSpan="6"
                  className="px-5 py-12 text-center text-sm text-[var(--text-secondary)]"
                >
                  Loading vouchers...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-[var(--border)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--text-muted)]">
          Showing {filteredVouchers.length} of {vouchers.length} vouchers
        </p>

        <p className="text-xs text-[var(--text-muted)]">
          {stats.revoked} revoked vouchers
        </p>
      </div>
    </div>
  );
}

/* ---------------- Generate modal ---------------- */

export function GenerateVoucherModal({
  form,
  packages,
  routers,
  selectedPackage,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  const selectedDuration = formatDuration(selectedPackage);

  return (
    <Modal onClose={onClose}>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Generate Vouchers
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Create a batch of Wi-Fi access codes.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] disabled:opacity-50"
        >
          <X size={19} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Internet package">
          <Select
            value={form.packageId}
            onChange={(value) => onChange('packageId', value)}
            width="w-full"
            options={[
              { label: 'Select a package', value: '' },
              ...packages.map((pkg) => {
                const durationText = formatDuration(pkg);
                const labelParts = [
                  pkg.name,
                  `KES ${Number(pkg.price).toLocaleString('en-KE')}`,
                  ...(durationText ? [durationText] : []),
                ];

                return {
                  label: labelParts.join(' · '),
                  value: String(pkg.id),
                };
              }),
            ]}
          />
        </FormField>

        {selectedPackage && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] p-3">
            <div className="flex items-center gap-2">
              <Wifi size={17} className="text-[var(--primary)]" />

              <p className="font-medium text-[var(--text-primary)]">
                {selectedPackage.name}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[var(--text-muted)]">
                  Price
                </p>
                <p className="mt-1 text-sm font-semibold">
                  KES {Number(selectedPackage.price).toLocaleString('en-KE')}
                </p>
              </div>

              <div>
                <p className="text-xs text-[var(--text-muted)]">
                  Duration
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {selectedDuration || '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        <FormField label="Number of vouchers">
          <input
            required
            type="number"
            min="1"
            max="100"
            step="1"
            value={form.count}
            onChange={(e) => onChange('count', e.target.value)}
            className="form-input"
          />

          <p className="text-xs text-[var(--text-muted)]">
            Generate between 1 and 100 vouchers per batch.
          </p>
        </FormField>

        {routers.length > 0 && (
          <FormField label="Target router (optional)">
            <Select
              value={form.routerId}
              onChange={(value) => onChange('routerId', value)}
              width="w-full"
              options={[
                { label: 'Default router', value: '' },
                ...routers.map((router) => ({
                  label: router.name || router.identity || router.id,
                  value: String(router.id),
                })),
              ]}
            />
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Code prefix (optional)">
            <input
              type="text"
              maxLength="12"
              value={form.prefix}
              onChange={(e) =>
                onChange('prefix', e.target.value.toUpperCase())
              }
              placeholder="e.g. WIFI"
              className="form-input"
            />
          </FormField>

          <FormField label="Code length">
            <input
              type="number"
              min="4"
              max="32"
              value={form.codeLength}
              onChange={(e) => onChange('codeLength', e.target.value)}
              className="form-input"
            />
          </FormField>
        </div>

        <div className="rounded-lg border border-[var(--border)] p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Total vouchers
            </p>

            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {Number(form.count) || 0}
            </p>
          </div>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Each voucher will be assigned to the selected package.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || !packages.length}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && (
              <RefreshCw size={16} className="animate-spin" />
            )}

            {saving ? 'Generating...' : 'Generate Vouchers'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Generated batch modal ---------------- */

export function GeneratedBatchModal({
  batch,
  onClose,
  onCopy,
  onCopyAll,
  onDone,
}) {
  return (
    <Modal onClose={onClose}>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="mb-2 inline-flex rounded-full bg-[var(--success)]/10 p-2 text-[var(--success)]">
            <CheckCircle2 size={22} />
          </div>

          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Vouchers generated
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Your voucher batch has been created.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
        >
          <X size={19} />
        </button>
      </div>

      {batch.id && (
        <div className="mb-4 rounded-lg bg-[var(--bg-muted)] p-3">
          <p className="text-xs text-[var(--text-muted)]">
            Batch ID
          </p>
          <p className="mt-1 font-semibold text-[var(--text-primary)]">
            {batch.id}
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Generated codes
        </p>

        <button
          type="button"
          onClick={onCopyAll}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          <Copy size={15} />
          Copy all
        </button>
      </div>

      {batch.vouchers.length ? (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {batch.vouchers.map((voucher, index) => (
            <div
              key={voucher.id || voucher.code || index}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3"
            >
              <p className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                {voucher.code}
              </p>

              <button
                type="button"
                onClick={() => onCopy(voucher.code)}
                className="rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
              >
                <Copy size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-[var(--bg-muted)] p-4 text-sm text-[var(--text-secondary)]">
          The batch was created, but the server did not return individual codes. Refresh the voucher list to view them.
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
        >
          Done
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- Voucher details modal ---------------- */

export function VoucherDetailsModal({
  voucher,
  revokingId,
  onClose,
  onCopy,
  onRevoke,
}) {
  if (!voucher) return null;

  return (
    <Modal onClose={onClose}>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Voucher Details
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            View voucher usage and router synchronization.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
        >
          <X size={19} />
        </button>
      </div>

      <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
        <p className="text-xs text-[var(--text-muted)]">
          Voucher code
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="break-all font-mono text-xl font-bold text-[var(--text-primary)]">
            {voucher.code}
          </p>

          <button
            type="button"
            onClick={() => onCopy(voucher.code)}
            className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
          >
            <Copy size={17} />
          </button>
        </div>

        <div className="mt-3">
          <StatusBadge status={voucher.status} />
        </div>
      </div>

      <div className="space-y-4">
        <DetailRow label="Voucher ID" value={voucher.id} />
        <DetailRow label="Package" value={voucher.packageName} />
        <DetailRow label="Batch ID" value={voucher.batchId || '—'} />
        <DetailRow label="Created" value={formatDate(voucher.createdAt)} />
        <DetailRow label="Expires" value={formatDate(voucher.expiresAt)} />
        <DetailRow label="Redeemed" value={formatDate(voucher.redeemedAt)} />
        <DetailRow label="MAC address" value={voucher.macAddress || '—'} />
        <DetailRow label="Phone number" value={voucher.phoneNumber || '—'} />
        <DetailRow label="Router ID" value={voucher.routerId || '—'} />
        <DetailRow
          label="Router revoked at"
          value={formatDate(voucher.routerRevokedAt)}
        />
        <DetailRow
          label="Revoke attempts"
          value={voucher.revokeAttempts}
        />
        <DetailRow
          label="Router cleanup"
          value={getCleanupStatus(voucher).label}
        />

        {voucher.revokeError && (
          <div className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-3">
            <p className="text-xs font-semibold text-[var(--danger)]">
              Router error
            </p>

            <p className="mt-1 break-words text-sm text-[var(--danger)]">
              {voucher.revokeError}
            </p>
          </div>
        )}
      </div>

      {voucher.status !== 'revoked' && (
        <div className="mt-6 border-t border-[var(--border)] pt-5">
          <button
            type="button"
            disabled={revokingId === voucher.id}
            onClick={() => onRevoke(voucher)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--danger)]/30 px-4 py-2.5 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger)]/10 disabled:opacity-50"
          >
            <Ban size={16} />
            {revokingId === voucher.id
              ? 'Revoking...'
              : 'Revoke Voucher'}
          </button>
        </div>
      )}
    </Modal>
  );
}

/* ---------------- Shared UI components ---------------- */

export function StatusBadge({ status }) {
  const config = {
    unused: {
      label: 'Unused',
      className: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
      icon: Clock,
    },
    active: {
      label: 'Active',
      className: 'bg-[var(--success)]/10 text-[var(--success)]',
      icon: CheckCircle2,
    },
    expired: {
      label: 'Expired',
      className: 'bg-[var(--warning)]/10 text-[var(--warning)]',
      icon: XCircle,
    },
    revoked: {
      label: 'Revoked',
      className: 'bg-[var(--danger)]/10 text-[var(--danger)]',
      icon: Ban,
    },
  };

  const item = config[status] || config.unused;
  const Icon = item.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${item.className}`}>
      <Icon size={13} />
      {item.label}
    </span>
  );
}

export function CleanupBadge({ cleanup }) {
  const classes = {
    success: 'bg-[var(--success)]/10 text-[var(--success)]',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    danger: 'bg-[var(--danger)]/10 text-[var(--danger)]',
    neutral: 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
  };

  const badgeStyle = classes[cleanup?.type] || classes.neutral;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${badgeStyle}`}>
      {cleanup?.type === 'success' && <CheckCircle2 size={12} />}
      {cleanup?.type === 'warning' && <Clock size={12} />}
      {cleanup?.type === 'danger' && <AlertCircle size={12} />}
      {cleanup?.label || '—'}
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

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3">
      <p className="text-sm text-[var(--text-secondary)]">
        {label}
      </p>

      <p className="max-w-[60%] break-words text-right text-sm font-medium text-[var(--text-primary)]">
        {value ?? '—'}
      </p>
    </div>
  );
}

export function Alert({ type, message, onClose }) {
  const danger = type === 'danger';

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 rounded-lg border p-3 text-sm ${
        danger
          ? 'border-[var(--danger)]/20 bg-[var(--danger)]/10 text-[var(--danger)]'
          : 'border-[var(--success)]/20 bg-[var(--success)]/10 text-[var(--success)]'
      }`}
    >
      <div className="flex items-start gap-2">
        {danger ? (
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
        ) : (
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
        )}
        <p>{message}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss message"
      >
        <X size={17} />
      </button>
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