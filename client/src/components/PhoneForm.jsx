import { useState } from "react";
import { initiatePurchase } from "../api/purchase";

export function PhoneForm({ packageId, onSuccess }) {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const fullPhone = `254${phone}`;
    if (!/^254\d{9}$/.test(fullPhone)) {
      setError('Enter a valid 9-digit phone number.');
      return;
    }

    setLoading(true);
    const result = await initiatePurchase(fullPhone, packageId);
    setLoading(false);

    if (result.status === 'ok') {
      onSuccess(fullPhone);
    } else if (result.status === 'already_active') {
      setError('You already have an active session on this number.');
    } else {
      setError('Something went wrong. Please try again.');
    }
  };

    return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold text-slate-900 text-center mt-6">
        Enter Your Phone Number
      </h1>
      <p className="text-slate-500 text-center mt-2 mb-6">
        We'll send your connection details to this number and start your
        session automatically.
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4">
        <label className="text-sm font-medium text-slate-700">Phone Number</label>
        <div className="flex mt-1 border border-slate-300 rounded-lg overflow-hidden">
          <span className="px-3 py-2 bg-slate-50 text-slate-600 border-r border-slate-300">
            +254
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="712 345 678"
            className="flex-1 px-3 py-2 outline-none"
          />
        </div>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Please wait...' : 'Continue'}
        </button>
      </form>

      <div className="mt-4 bg-blue-50 text-sm text-blue-700 p-3 rounded-lg">
        Make sure your number is correct. You'll receive a confirmation SMS
        once your session is active.
      </div>
    </div>
  );
}
