import { api } from './http.js';
import { formatDuration } from './packages.js';

export async function getPortalPackages(portalSlug) {
  const r = await api(`/api/portal/${encodeURIComponent(portalSlug)}/packages`);
  if (!r.ok) return r;

  return {
    ...r,
    data: {
      businessName: r.data.businessName,
      // Same shape PackageList already renders: name, price, duration
      packages: r.data.packages.map((p) => ({
        id: p.id,
        name: p.label,
        price: p.amount,
        duration: formatDuration(p.duration_minutes),
      })),
    },
  };
}