import { getPortalSlug } from './packages';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function initiatePurchase(phone, packageId, slug = getPortalSlug()) {
  if (!slug) {
    return { status: 'error', code: null, message: 'Missing portal identifier.' };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/purchase/${encodeURIComponent(slug)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, packageId }),
        signal: AbortSignal.timeout(20000),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (response.status === 409) {
      return {
        status: 'already_active',
        expiresAt: data.expiresAt || null,
        message: data.error,
      };
    }

    if (response.status === 429) {
      return {
        status: 'rate_limited',
        code: 429,
        message: data.error || 'Too many attempts for this number. Please wait 10 minutes.',
      };
    }

    if (!response.ok) {
      return {
        status: 'error',
        code: response.status,
        message: data.error || 'Purchase request failed.',
      };
    }

    return { status: 'ok', token: data.token };
  } catch (err) {
    return { status: 'error', code: null, message: 'network_failure' };
  }
}

export async function getSessionStatus(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { status: 'error', code: response.status };
    }

    let data;
    try {
      data = await response.json();
    } catch {
      return { status: 'error', code: response.status, message: 'bad_response' };
    }

    return data;
  } catch (err) {
    return { status: 'error', code: null, message: 'network_failure' };
  }
}