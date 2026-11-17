import { useEffect, useState } from 'react';

export function ActiveScreen({ sessionInfo, phone, selectedPackage }) {
  const expiresAt = sessionInfo?.expiresAt ? new Date(sessionInfo.expiresAt) : null;
  const [now, setNow] = useState(() => new Date());

  // Tick every 30 seconds so the remaining minutes stay accurate
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, [sessionInfo?.expiresAt]);

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const minutesRemaining = expiresAt
    ? Math.max(0, Math.round((expiresAt - now) / 60000))
    : null;

  const packageTitle = selectedPackage?.label || selectedPackage?.name;

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mt-8">
        <span className="text-green-600 text-2xl">✓</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mt-4">You're Connected!</h1>
      <p className="text-slate-500 mt-1 mb-6">Your internet session is now active.</p>

      <div className="bg-white border border-slate-200 rounded-xl p-4 text-left space-y-3">
        {packageTitle && (
          <div>
            <p className="text-xs text-slate-400">Package</p>
            <p className="font-medium text-slate-900">{packageTitle}</p>
          </div>
        )}
        {phone && (
          <div>
            <p className="text-xs text-slate-400">Phone Number</p>
            <p className="font-medium text-slate-900">+{phone}</p>
          </div>
        )}
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