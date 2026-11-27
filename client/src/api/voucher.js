import { api } from './http.js';
import { getArray, normalizeVoucher } from '../pages/tenant/voucherHelpers.js';

const VOUCHER_ROUTES = {
  list: '/api/vouchers',
  batches: '/api/vouchers/batches',
  batchDetails: (batchId) => `/api/vouchers/batches/${batchId}`,
  details: (id) => `/api/vouchers/${id}`,
  revoke: (id) => `/api/vouchers/${id}/revoke`,
  retryRevocation: (id) => `/api/vouchers/${id}/retry-revocation`,
};

export async function listVouchers({ status = 'all', batchId = 'all' } = {}) {
  const params = new URLSearchParams();

  if (status && status !== 'all') {
    params.set('status', status);
  }

  if (batchId && batchId !== 'all') {
    params.set('batchId', batchId);
  }

  const query = params.toString();
  const url = query ? `${VOUCHER_ROUTES.list}?${query}` : VOUCHER_ROUTES.list;
  const response = await api(url);

  if (!response.ok) {
    return response;
  }

  const rawVouchers = getArray(response.data, 'vouchers');

  return {
    ...response,
    data: {
      ...(response.data && typeof response.data === 'object' ? response.data : {}),
      vouchers: rawVouchers.map(normalizeVoucher),
    },
  };
}

export async function createVoucherBatch(payload) {
  const response = await api(VOUCHER_ROUTES.batches, {
    method: 'POST',
    body: payload,
  });

  if (!response.ok) {
    return response;
  }

  const data = response.data || {};
  const rawVouchers = getArray(data, 'vouchers');

  return {
    ...response,
    data: {
      ...data,
      batchId: data.batchId ?? data.batch_id ?? data.id,
      vouchers: rawVouchers.map(normalizeVoucher),
    },
  };
}

export async function getVoucherBatch(batchId) {
  const response = await api(VOUCHER_ROUTES.batchDetails(batchId));

  if (!response.ok) {
    return response;
  }

  const data = response.data || {};
  const rawVouchers = getArray(data, 'vouchers');

  return {
    ...response,
    data: {
      ...data,
      vouchers: rawVouchers.map(normalizeVoucher),
    },
  };
}

export async function getVoucherById(id) {
  const response = await api(VOUCHER_ROUTES.details(id));

  if (!response.ok) {
    return response;
  }

  const rawVoucher = response.data?.voucher || response.data;

  return {
    ...response,
    data: {
      ...(response.data && typeof response.data === 'object' ? response.data : {}),
      voucher: rawVoucher ? normalizeVoucher(rawVoucher) : null,
    },
  };
}

export async function revokeVoucherById(id) {
  return api(VOUCHER_ROUTES.revoke(id), {
    method: 'POST',
  });
}

export async function retryVoucherRevocation(id) {
  return api(VOUCHER_ROUTES.retryRevocation(id), {
    method: 'POST',
  });
}