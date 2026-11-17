const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DEFAULT_SLUG = import.meta.env.VITE_PORTAL_SLUG;

/**
 * Resolves the tenant portal slug from:
 * 1. URL query param (?portal=...)
 * 2. URL path segment (e.g., /a765320c-f968-4970-b017-00b715aae962)
 * 3. VITE_PORTAL_SLUG fallback for local development
 */
export function getPortalSlug() {
  const params = new URLSearchParams(window.location.search);
  const querySlug = params.get('portal');
  if (querySlug) return querySlug;

  const pathSegment = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
  if (pathSegment) return pathSegment;

  return DEFAULT_SLUG;
}

export async function getPackages(slug = getPortalSlug()) {
  if (!slug) {
    throw new Error('Missing portal identifier.');
  }

  const response = await fetch(`${API_BASE}/api/packages/${encodeURIComponent(slug)}`, {
    signal: AbortSignal.timeout(10000),
  });

  if (response.status === 404) {
    throw new Error('Wi-Fi hotspot not found.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Could not load packages');
  }

  return response.json();
}