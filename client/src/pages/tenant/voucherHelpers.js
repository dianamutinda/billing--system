export const emptyForm = {
  packageId: '',
  count: 10,
  routerId: '',
  prefix: '',
  codeLength: '8',
};

export const STATUSES = [
  { label: 'All statuses', value: 'all' },
  { label: 'Unused', value: 'unused' },
  { label: 'Active', value: 'active' },
  { label: 'Expired', value: 'expired' },
  { label: 'Revoked', value: 'revoked' },
];

export const ENDPOINTS = {
  list: '/api/vouchers',
  createBatch: '/api/vouchers/batches',
  routers: null,
  revoke: (id) => `/api/vouchers/${id}/revoke`,
};

export function normalizeVoucher(v, fallbackPackageName = 'Unknown package') {
  return {
    id: v.id,
    code: v.code,
    status: String(v.status || 'unused').toLowerCase(),
    packageId: v.package_id ?? v.packageId,
    packageName:
      v.package_name ??
      v.packageName ??
      v.package?.label ??
      v.package?.name ??
      fallbackPackageName,
    batchId: v.batch_id ?? v.batchId ?? '',
    createdAt: v.created_at ?? v.createdAt,
    expiresAt: v.expires_at ?? v.expiresAt,
    redeemedAt: v.redeemed_at ?? v.redeemedAt,
    macAddress: v.mac_address ?? v.macAddress,
    phoneNumber: v.phone_number ?? v.phoneNumber,
    routerId: v.router_id ?? v.routerId,
    routerRevokedAt: v.router_revoked_at ?? v.routerRevokedAt,
    revokeAttempts: Number(v.revoke_attempts ?? v.revokeAttempts ?? 0),
    revokeError: v.revoke_error ?? v.revokeError ?? '',
  };
}

export function getArray(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
}

export function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getCleanupStatus(voucher) {
  if (voucher.revokeError) {
    return {
      label: 'Retry required',
      type: 'danger',
      detail: voucher.revokeError,
    };
  }

  if (voucher.status === 'expired' && !voucher.routerRevokedAt) {
    return {
      label: 'Pending cleanup',
      type: 'warning',
      detail: '',
    };
  }

  if (voucher.routerRevokedAt) {
    return {
      label: 'Router cleaned',
      type: 'success',
      detail: '',
    };
  }

  if (voucher.status === 'revoked' && !voucher.routerId) {
    return {
      label: 'Not applicable',
      type: 'neutral',
      detail: '',
    };
  }

  return {
    label: '—',
    type: 'neutral',
    detail: '',
  };
}