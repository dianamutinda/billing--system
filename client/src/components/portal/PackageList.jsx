
import { useEffect, useState } from 'react';
import {
  Wifi,
  Clock3,
  ChevronRight,
  Headphones,
  ShieldCheck,
  RefreshCw,
  Signal,
} from 'lucide-react';
import { getPortalPackages } from '../../api/portalApi.js';

const colors = {
  accent: '#668A8A',
  background: '#F6F7F5',
  surface: '#FFFFFF',
  text: '#35434A',
  soft: '#DCE8E5',
};

export function PackageList({ slug, onSelect, supportPhone }) {
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

  const supportLink = supportPhone
    ? `https://wa.me/${supportPhone.replace(/\D/g, '')}`
    : null;

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6"
        style={{ backgroundColor: colors.background }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: colors.soft, color: colors.accent }}
          >
            <Wifi size={28} />
          </div>

          <p className="text-sm font-medium" style={{ color: colors.text }}>
            Loading available packages
          </p>

          <p className="mt-1 text-xs text-[#8B979A]">
            Please wait a moment...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-5"
        style={{ backgroundColor: colors.background }}
      >
        <div className="w-full max-w-sm rounded-2xl border border-[#E5E8E5] bg-white p-7 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Wifi size={23} />
          </div>

          <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
            Unable to load packages
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#78858A]">
            {error}
          </p>

          <button
            onClick={loadPackages}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: colors.accent }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (packages.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-5"
        style={{ backgroundColor: colors.background }}
      >
        <div className="w-full max-w-sm rounded-2xl border border-[#E5E8E5] bg-white p-7 text-center shadow-sm">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: colors.soft, color: colors.accent }}
          >
            <Wifi size={26} />
          </div>

          <h1 className="text-xl font-semibold" style={{ color: colors.text }}>
            {businessName || 'Wi-Fi Packages'}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#78858A]">
            There are currently no Wi-Fi packages available.
            Please check again later.
          </p>

          {supportLink && (
            <a
              href={supportLink}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: colors.accent }}
            >
              <Headphones size={17} />
              Contact Support
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-5 py-8 sm:py-12"
      style={{ backgroundColor: colors.background }}
    >
      <div className="mx-auto max-w-md">

        {/* Brand header */}
        <header className="mb-9 text-center">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: colors.accent }}
          >
            <Wifi size={32} strokeWidth={2} />
          </div>

          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: colors.text }}
          >
            {businessName || 'Welcome'}
          </h1>

          <p className="mt-2 text-sm text-[#78858A]">
            Connect to fast, reliable internet.
          </p>

          <div
            className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: colors.soft, color: colors.text }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colors.accent }}
            />
            Wi-Fi packages available
          </div>
        </header>

        {/* Package heading */}
        <section className="mb-5">
          <div className="flex items-end justify-between">
            <div>
              <h2
                className="text-lg font-bold"
                style={{ color: colors.text }}
              >
                Choose your package
              </h2>

              <p className="mt-1 text-sm text-[#78858A]">
                Select a plan to get connected.
              </p>
            </div>

            <span className="pb-1 text-xs font-medium text-[#929D9F]">
              {packages.length} {packages.length === 1 ? 'plan' : 'plans'}
            </span>
          </div>
        </section>

        {/* Package cards */}
        <section className="space-y-3">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelect(pkg)}
              className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-[#E5E9E6] bg-white p-5 text-left shadow-sm transition duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ '--tw-ring-color': colors.accent }}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition group-hover:text-white"
                  style={{
                    backgroundColor: colors.soft,
                    color: colors.accent,
                  }}
                >
                  <Clock3 size={23} />
                </div>

                <div className="min-w-0">
                  <h3
                    className="font-semibold"
                    style={{ color: colors.text }}
                  >
                    {pkg.name}
                  </h3>

                  <p className="mt-1 text-xs text-[#899497]">
                    {pkg.duration || 'Internet access'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="text-right">
                  <p
                    className="text-base font-bold"
                    style={{ color: colors.text }}
                  >
                    KES {Number(pkg.price).toLocaleString('en-KE')}
                  </p>

                  <p
                    className="mt-1 text-[11px] font-medium"
                    style={{ color: colors.accent }}
                  >
                    Select plan
                  </p>
                </div>

                <ChevronRight
                  size={19}
                  className="text-[#A0AAAB] transition group-hover:translate-x-1"
                  style={{ color: colors.accent }}
                />
              </div>
            </button>
          ))}
        </section>

        {/* Payment reassurance */}
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#E5E9E6] bg-white px-4 py-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: colors.soft, color: colors.accent }}
          >
            <ShieldCheck size={20} />
          </div>

          <div>
            <p className="text-xs font-semibold" style={{ color: colors.text }}>
              Secure M-Pesa payments
            </p>

            <p className="mt-1 text-[11px] text-[#899497]">
              Pay securely and get connected automatically.
            </p>
          </div>
        </div>

        {/* Contact support */}
        <section className="mt-6 rounded-2xl border border-[#E5E9E6] bg-white p-5">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.soft, color: colors.accent }}
            >
              <Headphones size={21} />
            </div>

            <div className="flex-1">
              <h3
                className="text-sm font-semibold"
                style={{ color: colors.text }}
              >
                Need help connecting?
              </h3>

              <p className="mt-1 text-xs leading-5 text-[#899497]">
                Having trouble choosing a package or making a payment?
                Our support team can help.
              </p>

              {supportLink ? (
                <a
                  href={supportLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-75"
                  style={{ color: colors.accent }}
                >
                  <Headphones size={16} />
                  Contact Support
                  <ChevronRight size={16} />
                </a>
              ) : (
                <p className="mt-3 text-xs font-medium text-[#78858A]">
                  Please contact the hotspot attendant for assistance.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[#929D9F]">
            <Signal size={13} />
            <span className="text-[11px] font-medium">
              Wi-Fi connectivity
            </span>
          </div>

          <p className="mt-2 text-[11px] text-[#929D9F]">
            Select a package to continue.
          </p>
        </footer>

      </div>
    </div>
  );
}
