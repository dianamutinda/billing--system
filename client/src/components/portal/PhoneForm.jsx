
import { useState } from 'react';
import { initiatePurchase } from '../../api/purchase.js';

/**
 * Normalizes Kenyan mobile numbers into 254XXXXXXXXX.
 */
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
        setError(result.message || 'Too many attempts for this number. Please wait 10 minutes.');
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
    <div className="mx-auto max-w-md p-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-2 text-sm text-slate-500 hover:text-slate-800"
        >
          ← Change package
        </button>
      )}

      <h1 className="mt-4 text-center text-2xl font-bold text-slate-900">
        Enter Your M-Pesa Number
      </h1>

      <p className="mb-6 mt-2 text-center text-slate-500">
        {selectedPackage
          ? `You'll receive an M-Pesa prompt for KES ${selectedPackage.price} (${selectedPackage.name}).`
          : "You'll receive an M-Pesa prompt on this number to complete payment."}
      </p>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-4"
      >
        <label
          htmlFor="phone-input"
          className="text-sm font-medium text-slate-700"
        >
          Phone Number
        </label>

        <input
          id="phone-input"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value.replace(/[^\d+\s-]/g, ''))
          }
          placeholder="0712 345 678 or 0117 345 678"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        />

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending M-Pesa prompt...' : 'Pay with M-Pesa'}
        </button>
      </form>

      <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
        Keep your phone unlocked. An M-Pesa PIN prompt will appear if the payment request is accepted.
      </div>
    </div>
  );
}
