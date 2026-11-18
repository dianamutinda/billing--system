
import { useEffect, useState } from 'react';
import { getPortalPackages } from '../../api/portalApi.js';

export function PackageList({ slug, onSelect }) {
  const [packages, setPackages] = useState([]);
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPackages = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getPortalPackages(slug);

      if (response.status === 404) {
        throw new Error(
          "This Wi-Fi link isn't valid. Please check with the hotspot owner."
        );
      }

      if (!response.ok) {
        throw new Error(
          response.data?.error || 'Could not load packages.'
        );
      }

      setPackages(response.data.packages || []);
      setBusinessName(response.data.businessName || '');
    } catch (err) {
      setError(err.message || 'Could not load packages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadPackages();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Loading Wi-Fi packages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="mb-4 text-sm text-red-600">{error}</p>

        <button
          onClick={loadPackages}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="mx-auto max-w-md p-6 text-center text-slate-600">
        <h1 className="mb-2 text-xl font-semibold text-slate-900">
          {businessName || 'Wi-Fi Packages'}
        </h1>
        No Wi-Fi packages are available right now.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-1 text-xl font-semibold text-slate-900">
        {businessName || 'Choose a Wi-Fi Package'}
      </h1>

      <p className="mb-5 text-sm text-slate-500">
        Select a plan to connect via M-Pesa
      </p>

      <div className="space-y-3">
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => onSelect(pkg)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500"
          >
            <div>
              <div className="font-medium text-slate-900">
                {pkg.name}
              </div>

              {pkg.duration && (
                <div className="text-xs text-slate-500">
                  {pkg.duration}
                </div>
              )}
            </div>

            <div className="text-base font-semibold text-emerald-600">
              KES {pkg.price}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
