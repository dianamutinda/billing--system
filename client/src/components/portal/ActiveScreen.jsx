import { useEffect, useState } from 'react';
import {
  Wifi,
  CheckCircle2,
  Clock3,
  Smartphone,
  ShieldCheck,
  CalendarClock,
} from 'lucide-react';

export function ActiveScreen({ sessionInfo, phone, selectedPackage }) {
  const expiresAt = sessionInfo?.expiresAt
    ? new Date(sessionInfo.expiresAt)
    : null;

  const [now, setNow] = useState(() => new Date());

  // Update remaining time every 30 seconds.
  useEffect(() => {
    if (!expiresAt) return;

    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, [sessionInfo?.expiresAt]);

  const formatTime = (date) => {
    if (!date) return 'Not available';

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhone = (value) => {
    if (!value) return '';

    const digits = value.replace(/\D/g, '');

    const localNumber = digits.startsWith('254')
      ? `0${digits.slice(3)}`
      : digits;

    if (localNumber.length === 10) {
      return `${localNumber.slice(0, 4)} ${localNumber.slice(4, 7)} ${localNumber.slice(7)}`;
    }

    return localNumber;
  };

  const minutesRemaining = expiresAt
    ? Math.max(0, Math.round((expiresAt - now) / 60000))
    : null;

  const packageTitle = selectedPackage?.label || selectedPackage?.name;

  const isExpired = minutesRemaining !== null && minutesRemaining === 0;

  return (
    <div className="min-h-screen bg-[#F6F7F5] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <main className="rounded-2xl border border-[#E2E8E4] bg-white px-5 py-8 text-center shadow-sm sm:px-7">
          {/* Connection status */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DCE8E5] text-[#668A8A]">
            <Wifi size={30} strokeWidth={1.8} />
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#DCE8E5] px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#668A8A]" />
            <span className="text-xs font-semibold text-[#557878]">
              {isExpired ? 'Session expired' : 'Connected'}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#35434A]">
            {isExpired ? 'Your session has ended' : "You're connected!"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#78858A]">
            {isExpired
              ? 'Your internet access time has ended.'
              : 'Your internet session is active. You can now browse the internet.'}
          </p>

          {/* Time remaining */}
          {minutesRemaining !== null && (
            <div className="mt-7 rounded-xl bg-[#F3F7F5] px-4 py-5">
              <div className="flex items-center justify-center gap-2 text-[#668A8A]">
                <Clock3 size={17} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Time remaining
                </span>
              </div>

              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[#35434A]">
                {minutesRemaining === 0
                  ? '00 min'
                  : minutesRemaining >= 60
                  ? `${Math.floor(minutesRemaining / 60)}h ${minutesRemaining % 60}m`
                  : `${minutesRemaining} min`}
              </p>

              <p className="mt-1 text-xs text-[#899497]">
                {isExpired
                  ? 'Your package time is over'
                  : `Expires at ${formatTime(expiresAt)}`}
              </p>
            </div>
          )}

          {/* Session details */}
          <div className="mt-6 rounded-xl border border-[#E7ECE8] bg-white p-4 text-left">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#899497]">
              Session details
            </p>

            <div className="space-y-4">
              {packageTitle && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3F7F5] text-[#668A8A]">
                    <Wifi size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-[#899497]">Package</p>
                    <p className="mt-0.5 break-words text-sm font-medium text-[#35434A]">
                      {packageTitle}
                    </p>
                  </div>
                </div>
              )}

              {phone && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3F7F5] text-[#668A8A]">
                    <Smartphone size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-[#899497]">Phone number</p>
                    <p className="mt-0.5 text-sm font-medium text-[#35434A]">
                      {formatPhone(phone)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3F7F5] text-[#668A8A]">
                  <CalendarClock size={17} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-[#899497]">Expires at</p>
                  <p className="mt-0.5 text-sm font-medium text-[#35434A]">
                    {formatTime(expiresAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-[#899497]">
            <ShieldCheck size={14} />
            <span>Your connection is ready to use.</span>
          </div>
        </main>
      </div>
    </div>
  );
}