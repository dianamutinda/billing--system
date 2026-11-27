import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  ArrowLeft,
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Copy,
  Download,
  Search,
  RefreshCw,
  Eye,
  X,
  Router,
  CalendarDays,
  AlertCircle,
  Wifi,
} from 'lucide-react';

import { api } from '../../api/http.js';
import Select from '../../components/ui/Select';
import {
  STATUSES,
  formatDate,
  getArray,
  getCleanupStatus,
  normalizeVoucher,
} from './voucherHelpers.js';

const ENDPOINTS = {
  details: (id) => `/api/vouchers/batches/${id}`,
  revoke: (id) => `/api/vouchers/${id}/revoke`,
};

export default function VoucherBatchDetails() {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [vouchers, setVouchers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedVoucherId, setSelectedVoucherId] = useState(null);

  const handleApiFailure = useCallback((r) => {
    if (r.status === 401) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    setError(
      `${r.status || 'Error'}: ${
        r.data?.error || r.data?.message || 'Something went wrong.'
      }`
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const r = await api(ENDPOINTS.details(batchId));

      if (!r.ok) {
        handleApiFailure(r);
        return;
      }

      const data = r.data || {};
      const batchData = data.batch || data;
      const voucherRecords = getArray(data, 'vouchers');

      setBatch({
        id: batchData.id ?? batchId,
        packageName:
          batchData.package_name ??
          batchData.packageName ??
          batchData.package?.label ??
          batchData.package?.name ??
          'Unknown package',
        packageId: batchData.package_id ?? batchData.packageId,
        packagePrice:
          batchData.package_price ??
          batchData.packagePrice ??
          batchData.package?.amount,
        duration:
          batchData.duration ??
          batchData.duration_label ??
          batchData.package?.duration ??
          (batchData.duration_minutes ? `${batchData.duration_minutes} mins` : ''),
        count:
          batchData.count ??
          batchData.total_vouchers ??
          voucherRecords.length,
        routerName:
          batchData.router_name ??
          batchData.routerName ??
          'Default router',
        createdAt: batchData.created_at ?? batchData.createdAt,
        prefix: batchData.prefix || '',
        codeLength: batchData.code_length ?? batchData.codeLength,
      });

      setVouchers(voucherRecords.map(normalizeVoucher));
      setError('');
    } catch {
      setError('Unable to load batch details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [batchId, handleApiFailure]);

  useEffect(() => {
    if (batchId) load();
  }, [batchId, load]);

  const stats = useMemo(
    () => ({
      total: vouchers.length,
      unused: vouchers.filter((v) => v.status === 'unused').length,
      active: vouchers.filter((v) => v.status === 'active').length,
      expired: vouchers.filter((v) => v.status === 'expired').length,
      revoked: vouchers.filter((v) => v.status === 'revoked').length,
    }),
    [vouchers]
  );

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        String(voucher.code || '').toLowerCase().includes(query) ||
        String(voucher.phoneNumber || '').toLowerCase().includes(query) ||
        String(voucher.macAddress || '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' || voucher.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vouchers, search, statusFilter]);

  const activeDetailsVoucher = useMemo(
    () => vouchers.find((v) => v.id === selectedVoucherId) || null,
    [vouchers, selectedVoucherId]
  );

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      setSuccess('Voucher code copied.');
      setError('');
    } catch {
      setError('Unable to copy voucher code.');
    }
  }

  async function copyAllCodes() {
    const codes = filteredVouchers
      .map((v) => v.code)
      .filter(Boolean)
      .join('\n');

    if (!codes) return;

    await copyCode(codes);
  }

  function exportVouchers() {
    if (!filteredVouchers.length) return;

    const columns = [
      'Code',
      'Status',
      'Package',
      'Created',
      'Expires',
      'Redeemed',
      'MAC Address',
      'Phone Number',
      'Router Cleanup',
      'Revoke Attempts',
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const rows = filteredVouchers.map((v) => [
      v.code,
      v.status,
      v.packageName,
      v.createdAt,
      v.expiresAt,
      v.redeemedAt,
      v.macAddress,
      v.phoneNumber,
      getCleanupStatus(v).label,
      v.revokeAttempts,
    ]);

    const csv = [
      columns.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `voucher-batch-${batchId}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  async function revokeVoucher(voucher) {
    if (voucher.status === 'revoked') return;

    const confirmed = window.confirm(`Revoke voucher ${voucher.code}?`);
    if (!confirmed) return;

    setRevokingId(voucher.id);
    setError('');
    setSuccess('');

    try {
      const r = await api(ENDPOINTS.revoke(voucher.id), {
        method: 'POST',
      });

      if (!r.ok) {
        handleApiFailure(r);
        return;
      }

      const data = r.data || {};
      if (data.routerRevoked === false || data.warning) {
        setSuccess(
          `Voucher ${voucher.code} marked revoked, but router cleanup is pending (${
            data.warning || data.routerError || 'router unreachable'
          }).`
        );
      } else {
        setSuccess(`Voucher ${voucher.code} revoked successfully.`);
      }

      await load();
    } catch {
      setError('Unable to revoke voucher. Please try again.');
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/tenant/vouchers')}
            aria-label="Back to vouchers"
            className="mt-1 rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Voucher Batch
            </h1>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              View generated codes and manage this batch.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportVouchers}
            disabled={!filteredVouchers.length}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
          >
            <Download size={17} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert
          type="danger"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess('')}
        />
      )}

      {loading && !batch && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center text-sm text-[var(--text-secondary)]">
          Loading batch details...
        </div>
      )}

      {!loading && !batch && !error && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center">
          <Ticket
            size={32}
            className="mx-auto mb-3 text-[var(--text-muted)]"
          />

          <p className="font-medium text-[var(--text-primary)]">
            Batch not found
          </p>

          <button
            type="button"
            onClick={() => navigate('/tenant/vouchers')}
            className="mt-4 text-sm font-medium text-[var(--primary)] hover:underline"
          >
            Return to vouchers
          </button>
        </div>
      )}

      {batch && (
        <>
          {/* Batch information */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-[var(--primary-soft)] p-2">
                    <Ticket size={20} className="text-[var(--primary)]" />
                  </div>

                  <div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Batch ID
                    </p>

                    <h2 className="font-semibold text-[var(--text-primary)]">
                      {batch.id}
                    </h2>
                  </div>
                </div>

                <p className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                  {batch.packageName}
                </p>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Package assigned to this voucher batch
                </p>
              </div>

              <div className="rounded-lg bg-[var(--bg-muted)] px-4 py-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Total generated
                </p>

                <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                  {batch.count}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[var(--border)] pt-5 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                icon={Wifi}
                label="Package"
                value={batch.packageName}
              />

              <InfoItem
                icon={CalendarDays}
                label="Created"
                value={formatDate(batch.createdAt)}
              />

              <InfoItem
                icon={Router}
                label="Target router"
                value={batch.routerName}
              />

              <InfoItem
                icon={Ticket}
                label="Code prefix"
                value={batch.prefix || 'None'}
              />
            </div>

            {(batch.packagePrice !== undefined ||
              batch.duration ||
              batch.codeLength) && (
              <div className="mt-4 flex flex-wrap gap-4 border-t border-[var(--border)] pt-4 text-sm text-[var(--text-secondary)]">
                {batch.packagePrice !== undefined && (
                  <p>
                    Price:{' '}
                    <strong className="text-[var(--text-primary)]">
                      KES {Number(batch.packagePrice).toLocaleString('en-KE')}
                    </strong>
                  </p>
                )}

                {batch.duration && (
                  <p>
                    Duration:{' '}
                    <strong className="text-[var(--text-primary)]">
                      {batch.duration}
                    </strong>
                  </p>
                )}

                {batch.codeLength && (
                  <p>
                    Code length:{' '}
                    <strong className="text-[var(--text-primary)]">
                      {batch.codeLength}
                    </strong>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Batch statistics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total Vouchers"
              value={stats.total}
              icon={Ticket}
            />

            <SummaryCard
              label="Unused"
              value={stats.unused}
              icon={Clock}
            />

            <SummaryCard
              label="Active"
              value={stats.active}
              icon={CheckCircle2}
            />

            <SummaryCard
              label="Expired"
              value={stats.expired}
              icon={XCircle}
            />
          </div>

          {/* Additional status breakdown */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryCard
              label="Revoked"
              value={stats.revoked}
              icon={Ban}
            />

            <SummaryCard
              label="Pending router cleanup"
              value={
                vouchers.filter(
                  (v) => v.status === 'expired' && !v.routerRevokedAt
                ).length
              }
              icon={Router}
            />
          </div>

          {/* Voucher list */}
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="flex flex-col gap-4 border-b border-[var(--border)] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-[var(--text-primary)]">
                    Generated Vouchers
                  </h2>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    All access codes belonging to this batch.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyAllCodes}
                  disabled={!filteredVouchers.length}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] disabled:opacity-50"
                >
                  <Copy size={16} />
                  Copy all codes
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  />

                  <input
                    type="text"
                    placeholder="Search voucher code, phone or MAC..."
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
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-[var(--bg-muted)]">
                  <tr className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                    <th className="px-5 py-3">Voucher code</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Redeemed</th>
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
                            <span className="font-semibold">
                              {voucher.code}
                            </span>

                            <button
                              type="button"
                              onClick={() => copyCode(voucher.code)}
                              title="Copy code"
                              className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={voucher.status} />
                        </td>

                        <td className="px-5 py-4 text-[var(--text-secondary)]">
                          {voucher.redeemedAt
                            ? formatDate(voucher.redeemedAt)
                            : 'Not redeemed'}
                        </td>

                        <td className="px-5 py-4 text-[var(--text-secondary)]">
                          {formatDate(voucher.expiresAt)}
                        </td>

                        <td className="px-5 py-4">
                          <CleanupBadge cleanup={cleanup} />

                          {voucher.revokeAttempts > 0 && (
                            <p
                              title={voucher.revokeError}
                              className="mt-1 text-xs text-[var(--text-muted)]"
                            >
                              {voucher.revokeAttempts} attempts
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              title="View voucher"
                              onClick={() => setSelectedVoucherId(voucher.id)}
                              className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              type="button"
                              title="Copy code"
                              onClick={() => copyCode(voucher.code)}
                              className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                            >
                              <Copy size={17} />
                            </button>

                            {voucher.status !== 'revoked' && (
                              <button
                                type="button"
                                title="Revoke voucher"
                                disabled={revokingId === voucher.id}
                                onClick={() => revokeVoucher(voucher)}
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
                      <td colSpan="6" className="px-5 py-12 text-center">
                        <Ticket
                          size={30}
                          className="mx-auto mb-3 text-[var(--text-muted)]"
                        />

                        <p className="font-medium text-[var(--text-primary)]">
                          No vouchers found
                        </p>

                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          Try adjusting your search or status filter.
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

            <div className="border-t border-[var(--border)] px-5 py-3">
              <p className="text-xs text-[var(--text-muted)]">
                Showing {filteredVouchers.length} of {vouchers.length} vouchers
              </p>
            </div>
          </div>
        </>
      )}

      {/* Individual voucher details */}
      {activeDetailsVoucher && (
        <Modal onClose={() => setSelectedVoucherId(null)}>
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Voucher Details
              </h2>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Voucher usage and router information.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedVoucherId(null)}
              className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
            >
              <X size={19} />
            </button>
          </div>

          <div className="mb-5 rounded-xl bg-[var(--bg-muted)] p-4">
            <p className="text-xs text-[var(--text-muted)]">
              Voucher code
            </p>

            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="break-all font-mono text-xl font-bold text-[var(--text-primary)]">
                {activeDetailsVoucher.code}
              </p>

              <button
                type="button"
                onClick={() => copyCode(activeDetailsVoucher.code)}
                className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
              >
                <Copy size={17} />
              </button>
            </div>

            <div className="mt-3">
              <StatusBadge status={activeDetailsVoucher.status} />
            </div>
          </div>

          <div className="space-y-4">
            <DetailRow label="Voucher ID" value={activeDetailsVoucher.id} />
            <DetailRow label="Package" value={activeDetailsVoucher.packageName} />
            <DetailRow label="Created" value={formatDate(activeDetailsVoucher.createdAt)} />
            <DetailRow label="Redeemed" value={formatDate(activeDetailsVoucher.redeemedAt)} />
            <DetailRow label="Expires" value={formatDate(activeDetailsVoucher.expiresAt)} />
            <DetailRow label="MAC address" value={activeDetailsVoucher.macAddress || '—'} />
            <DetailRow label="Phone number" value={activeDetailsVoucher.phoneNumber || '—'} />
            <DetailRow label="Router ID" value={activeDetailsVoucher.routerId || '—'} />
            <DetailRow
              label="Router revoked"
              value={formatDate(activeDetailsVoucher.routerRevokedAt)}
            />
            <DetailRow
              label="Revoke attempts"
              value={activeDetailsVoucher.revokeAttempts}
            />
            <DetailRow
              label="Cleanup status"
              value={getCleanupStatus(activeDetailsVoucher).label}
            />

            {activeDetailsVoucher.revokeError && (
              <div className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-3">
                <p className="text-xs font-semibold text-[var(--danger)]">
                  Router error
                </p>

                <p className="mt-1 break-words text-sm text-[var(--danger)]">
                  {activeDetailsVoucher.revokeError}
                </p>
              </div>
            )}
          </div>

          {activeDetailsVoucher.status !== 'revoked' && (
            <div className="mt-6 border-t border-[var(--border)] pt-5">
              <button
                type="button"
                disabled={revokingId === activeDetailsVoucher.id}
                onClick={() => revokeVoucher(activeDetailsVoucher)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--danger)]/30 px-4 py-2.5 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger)]/10 disabled:opacity-50"
              >
                <Ban size={16} />
                {revokingId === activeDetailsVoucher.id
                  ? 'Revoking...'
                  : 'Revoke Voucher'}
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* Summary card */
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

/* Information item */
function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={17} className="mt-0.5 text-[var(--text-muted)]" />

      <div>
        <p className="text-xs text-[var(--text-muted)]">
          {label}
        </p>

        <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

/* Lifecycle badge */
function StatusBadge({ status }) {
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

/* Router cleanup badge */
function CleanupBadge({ cleanup }) {
  const classes = {
    success: 'bg-[var(--success)]/10 text-[var(--success)]',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    danger: 'bg-[var(--danger)]/10 text-[var(--danger)]',
    neutral: 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${classes[cleanup.type] || classes.neutral}`}>
      {cleanup.type === 'success' && <CheckCircle2 size={12} />}
      {cleanup.type === 'warning' && <Clock size={12} />}
      {cleanup.type === 'danger' && <AlertCircle size={12} />}
      {cleanup.label}
    </span>
  );
}

/* Detail row */
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

/* Alert */
function Alert({ type, message, onClose }) {
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

      <button type="button" onClick={onClose} aria-label="Dismiss message">
        <X size={17} />
      </button>
    </div>
  );
}

/* Modal */
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