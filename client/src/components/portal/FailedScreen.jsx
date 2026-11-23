import {
  AlertCircle,
  RefreshCw,
  Package,
  Wifi,
  ShieldCheck,
} from 'lucide-react';

export function FailedScreen({ reason, onRetry, onBackToPackages }) {
  const displayReason =
    reason ||
    "We couldn't activate your session. Please try again or contact support if the problem continues.";

  return (
    <div className="min-h-screen bg-[#F6F7F5] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <main className="rounded-2xl border border-[#E2E8E4] bg-white px-5 py-8 text-center shadow-sm sm:px-7">
          {/* Failure icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F9EEEE] text-[#B66A6A]">
            <AlertCircle size={32} strokeWidth={1.8} />
          </div>

          {/* Heading */}
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#35434A]">
            Session failed
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#78858A]">
            We couldn't complete your connection. You can try again or select
            another package.
          </p>

          {/* Backend error message */}
          <div className="mt-6 rounded-xl border border-[#EBDADA] bg-[#FBF5F5] p-4 text-left">
            <div className="mb-2 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-[#B66A6A]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9D6262]">
                What happened
              </span>
            </div>

            <p className="break-words text-sm leading-6 text-[#805E5E]">
              {displayReason}
            </p>
          </div>

          {/* Helpful information */}
          <div className="mt-5 rounded-xl border border-[#E7ECE8] bg-[#F9FAF8] p-4 text-left">
            <p className="text-sm font-medium text-[#35434A]">
              Before trying again
            </p>

            <ul className="mt-3 space-y-3 text-sm leading-5 text-[#78858A]">
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#668A8A]" />
                Check that your M-Pesa balance is sufficient.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#668A8A]" />
                Make sure you entered the correct PIN.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#668A8A]" />
                Check whether you cancelled the payment prompt.
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="mt-7 space-y-3">
            <button
              type="button"
              onClick={onRetry}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#668A8A] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#557878] active:bg-[#4D7070]"
            >
              <RefreshCw size={17} />
              Try again
            </button>

            <button
              type="button"
              onClick={onBackToPackages}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#DCE4DF] bg-white px-4 py-3.5 text-sm font-semibold text-[#35434A] transition hover:bg-[#F6F7F5] active:bg-[#EEF1EF]"
            >
              <Package size={17} />
              Back to packages
            </button>
          </div>

          {/* Footer */}
          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-[#899497]">
            <ShieldCheck size={14} />
            <span>Your connection has not been activated.</span>
          </div>
        </main>
      </div>
    </div>
  );
}