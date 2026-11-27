import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  LoaderCircle,
  Monitor,
  Printer,
  RefreshCw,
  Router,
  ShieldCheck,
  Smartphone,
  XCircle,
  Ban,
  AlertCircle,
  RotateCcw,
  Hash,
  Package,
} from 'lucide-react';

import { api } from '../../api/http.js';

export default function TenantVoucherDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [copied, setCopied] = useState(false);

  const loadVoucher = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api(`/api/vouchers/${id}`);

      if (!response.ok) {
        throw new Error(
          response.data?.error ||
            response.data?.message ||
            'Unable to load voucher details.'
        );
      }

      const candidate =
        response.data?.voucher ||
        response.data?.vouchers?.find((v) => String(v.id) === String(id)) ||
        (response.data && typeof response.data === 'object' && !Array.isArray(response.data) && response.data.id
          ? response.data
          : null);

      if (!candidate) {
        throw new Error('Voucher not found.');
      }

      setVoucher(candidate);
    } catch (err) {
      setVoucher(null);
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadVoucher();
  }, [loadVoucher]);

  async function copyCode() {
    if (!voucher?.code) return;

    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Could not copy the voucher code.');
    }
  }

  async function revokeVoucher() {
    if (!voucher || !window.confirm('Revoke this voucher?')) return;

    setActionLoading('revoke');
    setError('');
    setNotice('');

    try {
      const response = await api(
        `/api/vouchers/${voucher.id}/revoke`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error(
          response.data?.error ||
            response.data?.message ||
            'Unable to revoke voucher.'
        );
      }

      const data = response.data || {};
      if (data.routerRevoked === false || data.warning) {
        setNotice(
          `Voucher revoked, but router cleanup is pending (${
            data.warning || data.routerError || 'router unreachable'
          }).`
        );
      } else {
        setNotice('Voucher revoked and router cleanup completed.');
      }

      await loadVoucher();
    } catch (err) {
      setError(err.message || 'Unable to revoke voucher.');
    } finally {
      setActionLoading('');
    }
  }

  async function retryRouterCleanup() {
    if (!voucher) return;

    setActionLoading('retry');
    setError('');
    setNotice('');

    try {
      const response = await api(
        `/api/vouchers/${voucher.id}/retry-revocation`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error(
          response.data?.error ||
            response.data?.message ||
            'Unable to retry router cleanup.'
        );
      }

      const data = response.data || {};
      if (data.routerRevoked === false || data.warning) {
        setError(
          data.warning || data.routerError || 'Router cleanup is still pending.'
        );
      } else {
        setNotice('Router cleanup succeeded.');
      }

      await loadVoucher();
    } catch (err) {
      setError(err.message || 'Unable to retry router cleanup.');
    } finally {
      setActionLoading('');
    }
  }

  function printVoucher() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle
          className="animate-spin text-[var(--primary)]"
          size={28}
        />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
          <AlertCircle
            size={32}
            className="mx-auto mb-3 text-[var(--danger)]"
          />
          <h2 className="font-semibold text-[var(--text-primary)]">
            Voucher not found
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {error || 'This voucher may have been deleted or is unavailable.'}
          </p>
        </div>
      </div>
    );
  }

  const status = (voucher.status || 'unused').toLowerCase();
  const isRevoked = status === 'revoked';
  const isExpired = status === 'expired';

  const routerCleanupPending =
    (isRevoked || isExpired) && !voucher.router_revoked_at;

  const canRevoke = !isRevoked && !isExpired;
  const canRetryCleanup =
    routerCleanupPending || Boolean(voucher.revoke_error);

  const packageName =
    voucher.package?.name ||
    voucher.package_name ||
    voucher.label ||
    'Wi-Fi package';

  const packageDuration =
    voucher.package?.duration ||
    voucher.duration ||
    formatDuration(voucher.duration_minutes);

  const packagePrice =
    voucher.package?.price ??
    voucher.package_price ??
    voucher.price_kes ??
    voucher.price;

  const packageRate =
    voucher.package?.rate_limit ||
    voucher.rate_limit ||
    voucher.speed ||
    null;

  const dataCap =
    voucher.package?.data_limit || voucher.data_limit || null;

  const expiry = formatDate(voucher.expires_at);
  const redeemedAt = formatDate(voucher.redeemed_at);
  const createdAt = formatDate(voucher.created_at);
  const revokedAt = formatDate(voucher.revoked_at);
  const routerRevokedAt = formatDate(voucher.router_revoked_at);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={17} />
            Back to vouchers
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
                Voucher details
              </h1>
              <StatusBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              View voucher information, redemption and router status.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <ActionButton
            variant="secondary"
            onClick={loadVoucher}
            disabled={loading || Boolean(actionLoading)}
          >
            <RefreshCw size={16} />
            Refresh
          </ActionButton>

          <ActionButton variant="secondary" onClick={printVoucher}>
            <Printer size={16} />
            Print
          </ActionButton>

          {canRevoke && (
            <ActionButton
              variant="danger"
              onClick={revokeVoucher}
              disabled={Boolean(actionLoading)}
            >
              {actionLoading === 'revoke' ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Ban size={16} />
              )}
              Revoke voucher
            </ActionButton>
          )}
        </div>
      </div>

      {notice && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/10 p-4">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0 text-[var(--success)]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {notice}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-[var(--danger)]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Action unsuccessful
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Voucher code */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">
              Voucher code
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="break-all font-mono text-2xl font-bold tracking-wider text-[var(--text-primary)] sm:text-3xl">
                {voucher.code || '—'}
              </h2>

              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy code'}
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Voucher ID: {voucher.id}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--primary-soft)] p-4 sm:min-w-40">
            <p className="text-xs text-[var(--text-secondary)]">
              Current status
            </p>
            <div className="mt-2">
              <StatusBadge status={status} />
            </div>
          </div>
        </div>
      </section>

      {/* Main information */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Package */}
        <SectionCard
          title="Package information"
          description="The Wi-Fi package assigned to this voucher."
          icon={Package}
        >
          <InfoRow label="Package" value={packageName} />
          <InfoRow label="Duration" value={packageDuration || '—'} />
          <InfoRow label="Price" value={formatMoney(packagePrice)} />
          <InfoRow label="Speed / rate limit" value={packageRate || '—'} />
          <InfoRow
            label="Data limit"
            value={dataCap || 'Unlimited / not set'}
          />
          <InfoRow
            label="Package ID"
            value={voucher.package_id || voucher.package?.id || '—'}
            mono
          />
        </SectionCard>

        {/* Lifecycle */}
        <SectionCard
          title="Voucher lifecycle"
          description="Creation, redemption and expiry information."
          icon={CalendarClock}
        >
          <InfoRow label="Created" value={createdAt} />
          <InfoRow label="Redeemed" value={redeemedAt} />
          <InfoRow label="Expires" value={expiry} />
          <InfoRow label="Revoked" value={revokedAt} />
          <InfoRow
            label="Remaining time"
            value={getRemainingTime(voucher.expires_at, status)}
          />
        </SectionCard>

        {/* Redemption */}
        <SectionCard
          title="Redemption details"
          description="Information recorded when the voucher was used."
          icon={Smartphone}
        >
          <InfoRow
            label="Phone number"
            value={voucher.phone_number || 'Not recorded'}
          />
          <InfoRow
            label="MAC address"
            value={voucher.mac_address || 'Not recorded'}
            mono
          />
          <InfoRow
            label="IP address"
            value={voucher.ip_address || voucher.ip || 'Not recorded'}
            mono
          />
          <InfoRow label="Username" value={voucher.username || '—'} mono />
          <InfoRow
            label="Router"
            value={
              voucher.router?.name || voucher.router_name || 'Default router'
            }
          />
        </SectionCard>

        {/* Batch */}
        <SectionCard
          title="Batch information"
          description="The batch this voucher was generated from."
          icon={Hash}
        >
          <InfoRow label="Batch ID" value={voucher.batch_id || '—'} mono />
          <InfoRow
            label="Batch name"
            value={voucher.batch?.name || voucher.batch_name || '—'}
          />
          <InfoRow
            label="Generated by"
            value={
              voucher.batch?.created_by_name ||
              voucher.created_by_name ||
              '—'
            }
          />

          {voucher.batch_id && (
            <div className="pt-3">
              <Link
                to={`/tenant/vouchers/batches/${voucher.batch_id}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
              >
                View batch details
                <ExternalLink size={15} />
              </Link>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Router cleanup */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[var(--primary-soft)] p-2.5 text-[var(--primary)]">
              <Router size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                Router cleanup
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Tracks whether the voucher has been removed or disabled on the router.
              </p>
            </div>
          </div>

          <RouterCleanupBadge
            status={
              voucher.router_revoked_at
                ? 'completed'
                : routerCleanupPending
                  ? 'pending'
                  : 'not-required'
            }
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow
            label="Router cleanup completed"
            value={routerRevokedAt}
          />
          <InfoRow
            label="Revocation attempts"
            value={voucher.revoke_attempts ?? 0}
          />
        </div>

        {voucher.revoke_error && (
          <div className="mt-5 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle
                size={18}
                className="mt-0.5 text-[var(--danger)]"
              />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Router cleanup error
                </p>
                <p className="mt-1 break-words text-sm text-[var(--text-secondary)]">
                  {voucher.revoke_error}
                </p>
              </div>
            </div>
          </div>
        )}

        {canRetryCleanup && (
          <div className="mt-5 flex flex-col gap-3 rounded-lg bg-[var(--bg-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Router cleanup needs attention
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Retry the router revocation operation for this voucher.
              </p>
            </div>

            <ActionButton
              onClick={retryRouterCleanup}
              disabled={Boolean(actionLoading)}
            >
              {actionLoading === 'retry' ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <RotateCcw size={16} />
              )}
              Retry cleanup
            </ActionButton>
          </div>
        )}

        {voucher.router_revoked_at && (
          <div className="mt-5 flex items-center gap-2 text-sm text-[var(--success)]">
            <ShieldCheck size={17} />
            Router cleanup has been confirmed.
          </div>
        )}
      </section>

      {/* Additional metadata */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <h2 className="font-semibold text-[var(--text-primary)]">
          Additional information
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow label="Voucher ID" value={voucher.id} mono />
          <InfoRow label="Batch ID" value={voucher.batch_id || '—'} mono />
          <InfoRow label="Router ID" value={voucher.router_id || '—'} mono />
          <InfoRow
            label="Last updated"
            value={formatDate(voucher.updated_at)}
          />
        </div>
      </section>
    </div>
  );
}

/* ---------------- Inline components ---------------- */

function SectionCard({ title, description, icon: Icon, children }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
          <Icon size={18} />
        </div>
        <div>
          <h2 className="font-semibold text-[var(--text-primary)]">
            {title}
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {description}
          </p>
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span
        className={`break-all text-sm font-medium text-[var(--text-primary)] sm:text-right ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value || '—'}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    unused: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
    active: 'bg-[var(--success)]/10 text-[var(--success)]',
    expired: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    revoked: 'bg-[var(--danger)]/10 text-[var(--danger)]',
  };

  const labels = {
    unused: 'Unused',
    active: 'Active',
    expired: 'Expired',
    revoked: 'Revoked',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || styles.unused
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function RouterCleanupBadge({ status }) {
  const config = {
    completed: {
      label: 'Completed',
      className: 'bg-[var(--success)]/10 text-[var(--success)]',
      icon: Check,
    },
    pending: {
      label: 'Pending cleanup',
      className: 'bg-[var(--warning)]/10 text-[var(--warning)]',
      icon: Clock3,
    },
    'not-required': {
      label: 'Not required',
      className: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
      icon: Monitor,
    },
  };

  const item = config[status] || config['not-required'];
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${item.className}`}
    >
      <Icon size={14} />
      {item.label}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) {
  const styles = {
    primary:
      'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]',
    secondary:
      'border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]',
    danger:
      'border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

/* ---------------- Helpers ---------------- */

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatDuration(minutes) {
  if (!minutes) return null;

  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

function formatMoney(value) {
  if (value === undefined || value === null || value === '') return '—';

  return `KSh ${Number(value).toLocaleString()}`;
}

function getRemainingTime(expiresAt, status) {
  if (status === 'revoked') return 'Revoked';
  if (status === 'expired') return 'Expired';
  if (!expiresAt) return 'No expiry recorded';

  const remaining = new Date(expiresAt).getTime() - Date.now();

  if (Number.isNaN(remaining)) return '—';
  if (remaining <= 0) return 'Expired';

  const minutes = Math.floor(remaining / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${mins}m remaining`;

  return `${mins}m remaining`;
}