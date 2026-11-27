import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { api } from '../../api/http.js';
import { listPackages } from '../../api/packages.js';

import {
  SummaryCards,
  VoucherList,
  GenerateVoucherModal,
  GeneratedBatchModal,
  VoucherDetailsModal,
  Alert,
} from './VoucherComponents.jsx';

import {
  emptyForm,
  ENDPOINTS,
  normalizeVoucher,
  getArray,
  getCleanupStatus,
} from './voucherHelpers.js';

function getPackageLabel(pkg) {
  if (!pkg) return '';
  return String(
    pkg.label || pkg.name || pkg.title || pkg.package_name || pkg.packageName || ''
  ).trim();
}

function resolveVoucherPackageName(item, packages = [], fallbackPkgName = '') {
  const direct =
    item?.label ||
    item?.package_name ||
    item?.packageName ||
    item?.package_label ||
    '';
  if (String(direct).trim()) return String(direct).trim();

  const pkgId = item?.package_id ?? item?.packageId;
  if (pkgId) {
    const matchedById = packages.find((pkg) => String(pkg.id) === String(pkgId));
    const idLabel = getPackageLabel(matchedById);
    if (idLabel) return idLabel;
  }

  const itemDuration = Number(item?.duration_minutes ?? item?.durationMinutes);
  const itemPrice = Number(item?.price_kes ?? item?.priceKes ?? item?.price);
  if (Number.isFinite(itemDuration) && itemDuration > 0) {
    const matchedBySpec = packages.find((pkg) => {
      const pkgDur = Number(pkg.duration_minutes ?? pkg.durationMinutes);
      if (pkgDur !== itemDuration) return false;
      const pkgPrice = Number(pkg.price_kes ?? pkg.price ?? pkg.amount);
      if (Number.isFinite(itemPrice) && Number.isFinite(pkgPrice)) {
        return pkgPrice === itemPrice;
      }
      return true;
    });
    const specLabel = getPackageLabel(matchedBySpec);
    if (specLabel) return specLabel;
  }

  if (String(fallbackPkgName || '').trim()) {
    return String(fallbackPkgName).trim();
  }

  if (Number.isFinite(itemDuration) && itemDuration > 0) {
    return `${itemDuration} mins`;
  }

  return 'Unknown package';
}

export default function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [routers, setRouters] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [showDetails, setShowDetails] = useState(null);
  const [generatedBatch, setGeneratedBatch] = useState(null);

  /* ---------------- API error handling ---------------- */

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

  /* ---------------- Load vouchers ---------------- */

  const load = useCallback(
    async ({ status = statusFilter, batchId = batchFilter, pkgList = packages } = {}) => {
      setLoading(true);

      try {
        const params = new URLSearchParams();
        if (status && status !== 'all') params.set('status', status);
        if (batchId && batchId !== 'all') params.set('batchId', batchId);

        const query = params.toString();
        const url = query ? `${ENDPOINTS.list}?${query}` : ENDPOINTS.list;

        const r = await api(url);

        if (!r.ok) {
          handleApiFailure(r);
          return;
        }

        const records = getArray(r.data, 'vouchers');
        setVouchers(
          records.map((item) => {
            const resolvedName = resolveVoucherPackageName(item, pkgList);
            const normalized = normalizeVoucher(
              {
                ...item,
                label: item.label || resolvedName,
                package_name: item.package_name || resolvedName,
              },
              resolvedName
            );
            return {
              ...normalized,
              packageName:
                normalized.packageName && normalized.packageName !== 'Unknown package'
                  ? normalized.packageName
                  : resolvedName,
            };
          })
        );
        setError('');
      } catch {
        setError('Unable to connect to the server. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, batchFilter, packages, handleApiFailure]
  );

  /* ---------------- Load packages ---------------- */

  const loadPackages = useCallback(async () => {
    try {
      const r = await listPackages();

      if (r.ok) {
        const list = Array.isArray(r.data) ? r.data : getArray(r.data, 'packages');
        setPackages(
          list.filter((pkg) => {
            if (pkg.is_active === false) return false;
            const st = String(pkg.status || '').toLowerCase();
            return !['inactive', 'archived', 'disabled'].includes(st);
          })
        );
      }
    } catch {
      setError('Unable to load packages.');
    }
  }, []);

  /* ---------------- Load routers ---------------- */

  const loadRouters = useCallback(async () => {
    if (!ENDPOINTS.routers) return;

    try {
      const r = await api(ENDPOINTS.routers);

      if (r.ok) {
        setRouters(getArray(r.data, 'routers'));
      }
    } catch {
      // Router selection is optional when tenant uses a single default router.
    }
  }, []);

  /* ---------------- Initial & filter loading ---------------- */

  useEffect(() => {
    loadPackages();
    loadRouters();
  }, [loadPackages, loadRouters]);

  useEffect(() => {
    load({ status: statusFilter, batchId: batchFilter, pkgList: packages });
  }, [load, statusFilter, batchFilter, packages]);

  /* ---------------- Filtering ---------------- */

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        String(voucher.code || '').toLowerCase().includes(query) ||
        String(voucher.phoneNumber || '').toLowerCase().includes(query) ||
        String(voucher.macAddress || '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        voucher.status === statusFilter;

      const matchesBatch =
        batchFilter === 'all' ||
        String(voucher.batchId) === String(batchFilter);

      return matchesSearch && matchesStatus && matchesBatch;
    });
  }, [vouchers, search, statusFilter, batchFilter]);

  /* ---------------- Statistics ---------------- */

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

  /* ---------------- Batch filters ---------------- */

  const batches = useMemo(() => {
    const unique = new Map();

    vouchers.forEach((voucher) => {
      if (voucher.batchId) {
        unique.set(String(voucher.batchId), voucher.batchId);
      }
    });

    return Array.from(unique.values());
  }, [vouchers]);

  /* ---------------- Form handling ---------------- */

  function handleFormChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openGenerator() {
    setForm({ ...emptyForm });
    setGeneratedBatch(null);
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function closeGenerator() {
    if (saving) return;

    setShowForm(false);
    setForm({ ...emptyForm });
  }

  /* ---------------- Selected package & voucher ---------------- */

  const selectedPackage = packages.find(
    (pkg) => String(pkg.id) === String(form.packageId)
  );

  const selectedVoucher = showDetails
    ? vouchers.find((voucher) => voucher.id === showDetails.id) || showDetails
    : null;

  /* ---------------- Generate vouchers ---------------- */

  async function handleGenerate(e) {
    e.preventDefault();

    const count = Number(form.count);
    const codeLength = Number(form.codeLength);

    if (!form.packageId) {
      setError('Please select an internet package.');
      return;
    }

    if (!Number.isInteger(count) || count < 1 || count > 100) {
      setError('Voucher quantity must be between 1 and 100.');
      return;
    }

    if (
      form.codeLength &&
      (!Number.isInteger(codeLength) ||
        codeLength < 4 ||
        codeLength > 32)
    ) {
      setError('Code length must be between 4 and 32 characters.');
      return;
    }

    const pkgLabel = getPackageLabel(selectedPackage);
    const body = {
      packageId: form.packageId,
      count,
      ...(pkgLabel ? { label: pkgLabel } : {}),
      ...(form.routerId ? { routerId: form.routerId } : {}),
      ...(form.prefix?.trim()
        ? { prefix: form.prefix.trim().toUpperCase() }
        : {}),
      ...(form.codeLength ? { codeLength } : {}),
    };

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const r = await api(ENDPOINTS.createBatch, {
        method: 'POST',
        body,
      });

      if (!r.ok) {
        handleApiFailure(r);
        return;
      }

      const data = r.data || {};
      const fallbackPkgName = pkgLabel || 'Unknown package';
      const generated = getArray(data, 'vouchers').map((item) => {
        const resolvedName = resolveVoucherPackageName(item, packages, fallbackPkgName);
        const normalized = normalizeVoucher(
          {
            ...item,
            label: item.label || resolvedName,
            package_name: item.package_name || resolvedName,
          },
          resolvedName
        );
        return {
          ...normalized,
          packageName:
            normalized.packageName && normalized.packageName !== 'Unknown package'
              ? normalized.packageName
              : resolvedName,
        };
      });

      setGeneratedBatch({
        id: data.batchId ?? data.batch_id ?? data.id,
        vouchers: generated,
      });

      setShowForm(false);
      setSuccess(
        `${generated.length || count} vouchers generated successfully.`
      );

      await load({ status: statusFilter, batchId: batchFilter, pkgList: packages });
    } catch {
      setError('Unable to generate vouchers. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  /* ---------------- Revoke voucher ---------------- */

  async function revokeVoucher(voucher) {
    if (voucher.status === 'revoked') return;

    const confirmed = window.confirm(
      `Are you sure you want to revoke voucher ${voucher.code}?`
    );

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
        setSuccess(`Voucher ${voucher.code} has been revoked.`);
      }

      await load({ status: statusFilter, batchId: batchFilter, pkgList: packages });

      if (showDetails?.id === voucher.id) {
        setShowDetails(null);
      }
    } catch {
      setError('Unable to revoke voucher. Please try again.');
    } finally {
      setRevokingId(null);
    }
  }

  /* ---------------- Copy voucher codes ---------------- */

  async function copyCode(code) {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setSuccess('Voucher code copied.');
      setError('');
    } catch {
      setError('Unable to copy voucher code.');
    }
  }

  async function copyBatch() {
    if (!generatedBatch?.vouchers?.length) return;

    const codes = generatedBatch.vouchers
      .map((voucher) => voucher.code)
      .filter(Boolean)
      .join('\n');

    if (codes) {
      await copyCode(codes);
    }
  }

  /* ---------------- Export vouchers ---------------- */

  function exportVouchers() {
    if (!filteredVouchers.length) return;

    const columns = [
      'Code',
      'Package',
      'Status',
      'Batch ID',
      'Created',
      'Expires',
      'Redeemed',
      'MAC Address',
      'Phone Number',
      'Router Cleanup',
    ];

    const rows = filteredVouchers.map((voucher) => [
      voucher.code,
      voucher.packageName,
      voucher.status,
      voucher.batchId,
      voucher.createdAt,
      voucher.expiresAt,
      voucher.redeemedAt,
      voucher.macAddress,
      voucher.phoneNumber,
      getCleanupStatus(voucher).label,
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

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
    link.download = 'vouchers.csv';
    link.click();

    URL.revokeObjectURL(url);
  }

  /* ---------------- Page ---------------- */

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Vouchers
          </h1>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Generate and manage Wi-Fi access vouchers for your customers.
          </p>
        </div>

        <button
          type="button"
          onClick={openGenerator}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)]"
        >
          <Plus size={18} />
          Generate Vouchers
        </button>
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

      {/* Statistics */}
      <SummaryCards stats={stats} />

      {/* Voucher list */}
      <VoucherList
        vouchers={vouchers}
        filteredVouchers={filteredVouchers}
        loading={loading}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        batchFilter={batchFilter}
        setBatchFilter={setBatchFilter}
        batches={batches}
        stats={stats}
        revokingId={revokingId}
        onRefresh={() => load({ status: statusFilter, batchId: batchFilter, pkgList: packages })}
        onExport={exportVouchers}
        onCopy={copyCode}
        onView={setShowDetails}
        onRevoke={revokeVoucher}
      />

      {/* Generate modal */}
      {showForm && (
        <GenerateVoucherModal
          form={form}
          packages={packages}
          routers={routers}
          selectedPackage={selectedPackage}
          saving={saving}
          onChange={handleFormChange}
          onClose={closeGenerator}
          onSubmit={handleGenerate}
        />
      )}

      {/* Generated batch result */}
      {generatedBatch && (
        <GeneratedBatchModal
          batch={generatedBatch}
          onClose={() => setGeneratedBatch(null)}
          onCopy={copyCode}
          onCopyAll={copyBatch}
          onDone={() => {
            setGeneratedBatch(null);
            setShowForm(false);
            setSuccess('');
          }}
        />
      )}

      {/* Voucher details */}
      {selectedVoucher && (
        <VoucherDetailsModal
          voucher={selectedVoucher}
          revokingId={revokingId}
          onClose={() => setShowDetails(null)}
          onCopy={copyCode}
          onRevoke={revokeVoucher}
        />
      )}
    </div>
  );
}