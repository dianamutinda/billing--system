import { useState } from 'react';
import { initiatePurchase } from '../api/purchase';

/**
 * Normalizes any Kenyan mobile input (07..., 01..., 7..., 1..., +254...)
 * into 254XXXXXXXXX, or returns null if invalid.
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
    const result = await initiatePurchase(normalizedPhone, resolvedPackageId);
    setLoading(false);

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
  };

  return (
    <div className="max-w-md mx-auto p-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-2 text-sm text-slate-500 hover:text-slate-800"
        >
          ← Change package
        </button>
      )}

      <h1 className="text-2xl font-bold text-slate-900 text-center mt-4">
        Enter Your M-Pesa Number
      </h1>
      <p className="text-slate-500 text-center mt-2 mb-6">
        {selectedPackage
          ? `You'll receive an M-Pesa prompt for KES ${selectedPackage.amount} (${selectedPackage.label}).`
          : "You'll receive an M-Pesa prompt on this number to complete payment."}
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4">
        <label htmlFor="phone-input" className="text-sm font-medium text-slate-700">
          Phone Number
        </label>
        <input
          id="phone-input"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s-]/g, ''))}
          placeholder="0712 345 678 or 0117 345 678"
          className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        />

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending M-Pesa prompt...' : 'Pay with M-Pesa'}
        </button>
      </form>

      <div className="mt-4 bg-blue-50 text-sm text-blue-700 p-3 rounded-lg">
        Keep your phone unlocked. An M-Pesa PIN prompt will pop up in a few seconds.
      </div>
    </div>
  );
}