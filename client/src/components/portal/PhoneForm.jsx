
import { useState } from 'react';
import {
  ArrowLeft,
  Wifi,
  Smartphone,
  ShieldCheck,
  LockKeyhole,
  ChevronRight,
  LoaderCircle,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { initiatePurchase } from '../../api/purchase.js';

function normalizeKenyanPhone(raw) {
  const digits = raw.replace(/\D/g, '');

  if (/^0[17]\d{8}$/.test(digits)) {
    return `254${digits.slice(1)}`;
  }

  if (/^[17]\d{8}$/.test(digits)) {
    return `254${digits}`;
  }

  if (/^254[17]\d{8}$/.test(digits)) {
    return digits;
  }

  return null;
}

export function PhoneForm({
  slug,
  packageId,
  selectedPackage,
  onSuccess,
  onAlreadyActive,
  onBack,
}) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!slug) {
      setError('Missing hotspot identification. Please reopen the Wi-Fi link.');
      return;
    }

    const resolvedPackageId = selectedPackage?.id || packageId;

    if (!resolvedPackageId) {
      setError('No package selected. Please go back and choose a package.');
      return;
    }

    const normalizedPhone = normalizeKenyanPhone(phone);

    if (!normalizedPhone) {
      setError('Enter a valid Kenyan phone number (e.g. 0712345678 or 0117345678).');
      return;
    }

    setLoading(true);

    try {
      const result = await initiatePurchase(
        normalizedPhone,
        resolvedPackageId,
        slug
      );

      if (result.status === 'ok') {
        onSuccess(normalizedPhone, result.token);
      } else if (result.status === 'already_active') {
        if (onAlreadyActive && result.expiresAt) {
          onAlreadyActive(normalizedPhone, result.expiresAt);
        } else {
          setError('You already have an active session on this number.');
        }
      } else if (result.status === 'rate_limited') {
        setError(
          result.message ||
          'Too many attempts for this number. Please wait 10 minutes.'
        );
      } else if (result.message === 'network_failure') {
        setError('Could not reach the server. Check your connection and try again.');
      } else {
        setError(result.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F5] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-md">

        {/* Centered page heading */}
        <header className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DCE8E5] text-[#668A8A]">
            <Smartphone size={29} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#35434A]">
            Complete your payment
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#78858A]">
            Enter your M-Pesa number below. We'll send a payment request directly to your phone.
          </p>
        </header>

        {/* Main content */}
        <div className="space-y-5">

          {/* Back to packages */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DCE4DF] bg-white px-4 py-3.5 text-sm font-semibold text-[#35434A] transition hover:border-[#668A8A] hover:bg-[#F3F7F5] active:bg-[#DCE8E5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft size={18} className="text-[#668A8A]" />
              Back to packages
            </button>
          )}

          {/* Selected package */}
          {selectedPackage && (
            <div className="rounded-2xl border border-[#E2E8E4] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#899497]">
                  Selected package
                </span>

                <span className="rounded-full bg-[#DCE8E5] px-3 py-1 text-[11px] font-medium text-[#557878]">
                  Your selection
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DCE8E5] text-[#668A8A]">
                    <Wifi size={22} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-semibold text-[#35434A]">
                      {selectedPackage.name}
                    </h2>

                    <p className="mt-1 text-xs text-[#899497]">
                      {selectedPackage.duration || 'Internet access'}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 text-lg font-bold text-[#35434A]">
                  KES {Number(selectedPackage.price).toLocaleString('en-KE')}
                </p>
              </div>
            </div>
          )}

          {/* Payment form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#E2E8E4] bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5">
              <h2 className="text-base font-semibold text-[#35434A]">
                M-Pesa payment details
              </h2>

              <p className="mt-1 text-xs text-[#899497]">
                Where should we send the payment request?
              </p>
            </div>

            {/* Phone input */}
            <div>
              <label
                htmlFor="phone-input"
                className="mb-2 block text-sm font-medium text-[#35434A]"
              >
                M-Pesa phone number
              </label>

              <div className="overflow-hidden rounded-xl border border-[#DCE2DF] bg-white transition focus-within:border-[#668A8A] focus-within:ring-2 focus-within:ring-[#DCE8E5]">
                <input
                  id="phone-input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/[^\d\s-]/g, ''));
                    if (error) setError(null);
                  }}
                  placeholder="0712 345 678"
                  disabled={loading}
                  className="w-full bg-transparent px-4 py-3.5 text-base text-[#35434A] outline-none placeholder:text-[#ADB7B7] disabled:opacity-60"
                />
              </div>

              <p className="mt-2 text-xs text-[#899497]">
                Enter the number registered with M-Pesa.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3"
              >
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <p className="text-xs leading-5 text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* Payment button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#668A8A] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#557878] active:bg-[#4D7070] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Sending payment request...
                </>
              ) : (
                <>
                  Pay with M-Pesa
                  <ChevronRight size={18} />
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2">
              <LockKeyhole size={13} className="text-[#899D98]" />

              <span className="text-[11px] text-[#899497]">
                Secure payment request
              </span>
            </div>
          </form>

          {/* Payment instructions */}
          <section className="rounded-2xl border border-[#DCE8E5] bg-[#DCE8E5]/60 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#668A8A]">
                <ShieldCheck size={19} />
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#35434A]">
                  What happens next?
                </h3>

                <div className="mt-3 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#668A8A]" />
                    <p className="text-xs leading-5 text-[#657579]">
                      An M-Pesa payment prompt will appear on your phone.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#668A8A]" />
                    <p className="text-xs leading-5 text-[#657579]">
                      Enter your M-Pesa PIN to authorize payment.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#668A8A]" />
                    <p className="text-xs leading-5 text-[#657579]">
                      Once payment is confirmed, your internet access will be activated.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="pb-4 pt-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[#929D9F]">
              <Clock3 size={13} />

              <span className="text-[11px]">
                Payment confirmation may take a moment.
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
