import { PACKAGES } from '../api/packages';

export function ActiveScreen({ sessionInfo, phone, packageId }) {
  const expiresAt = sessionInfo?.expiresAt ? new Date(sessionInfo.expiresAt) : null;

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const minutesRemaining = expiresAt
    ? Math.max(0, Math.round((expiresAt - new Date()) / 60000))
    : null;

    const pkg = PACKAGES.find((p) => p.id === packageId);

      return (
    <div className="max-w-md mx-auto p-4 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mt-8">
        <span className="text-green-600 text-2xl">✓</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mt-4">You're Connected!</h1>
      <p className="text-slate-500 mt-1 mb-6">Your internet session is now active.</p>

      <div className="bg-white border border-slate-200 rounded-xl p-4 text-left space-y-3">
        <div>
          <p className="text-xs text-slate-400">Package</p>
          <p className="font-medium text-slate-900">{pkg?.name ?? packageId}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Phone Number</p>
          <p className="font-medium text-slate-900">+{phone}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Expires At</p>
          <p className="font-medium text-slate-900">
            {formatTime(expiresAt)}
            {minutesRemaining !== null && ` (in ${minutesRemaining} minutes)`}
          </p>
        </div>
      </div>
    </div>
  );
}