import { useEffect } from 'react';
import {
  Wifi,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useSessionPolling } from '../../hooks/useSessionPolling';

export function ProcessingScreen({ token, onActive, onFailed, onRetry }) {
  const { status, expiresAt, message, timedOut, checking, recheck } =
    useSessionPolling(token, true);

  useEffect(() => {
    if (status === 'active') {
      onActive(expiresAt);
    } else if (status === 'failed' || status === 'not_found') {
      onFailed(message);
    }
  }, [status, expiresAt, message, onActive, onFailed]);

  const isPaid = status === 'paid' || status === 'active';
  const isReview = status === 'processing';
  const isDelayed = timedOut && status !== 'active';

  const steps = [
    {
      label: 'M-Pesa payment confirmed',
      complete: isPaid,
    },
    {
      label: 'Internet session activated',
      complete: status === 'active',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F7F5] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <main className="rounded-2xl border border-[#E2E8E4] bg-white px-5 py-8 text-center shadow-sm sm:px-7">
          {/* Status icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DCE8E5] text-[#668A8A]">
            {isReview ? (
              <ShieldCheck size={29} strokeWidth={1.8} />
            ) : isPaid ? (
              <Wifi size={29} strokeWidth={1.8} />
            ) : (
              <Smartphone size={29} strokeWidth={1.8} />
            )}
          </div>

          {/* Heading */}
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#35434A]">
            {isReview
              ? 'Confirming your payment'
              : isPaid
              ? 'Activating your Wi-Fi'
              : 'Check your phone'}
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#78858A]">
            {isReview
              ? 'We received your payment and are verifying the transaction details.'
              : isPaid
              ? 'Payment received. We are connecting your device now.'
              : 'Enter your M-Pesa PIN on the prompt sent to your phone.'}
          </p>

          {/* Loading indicator */}
          {!isReview && !isDelayed && status !== 'active' && (
            <div className="mt-7 flex items-center justify-center gap-2 text-sm font-medium text-[#668A8A]">
              <LoaderCircle size={17} className="animate-spin" />
              {isPaid ? 'Setting up your connection...' : 'Waiting for confirmation...'}
            </div>
          )}

          {/* Progress */}
          {!isReview && (
            <div className="mt-8 rounded-xl border border-[#E7ECE8] bg-[#F9FAF8] p-4 text-left">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#899497]">
                Connection progress
              </p>

              <div className="space-y-5">
                {steps.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        step.complete
                          ? 'bg-[#DCE8E5] text-[#668A8A]'
                          : 'bg-[#EEF1EF] text-[#A1ACAA]'
                      }`}
                    >
                      {step.complete ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <span className="text-xs font-semibold">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-sm ${
                        step.complete
                          ? 'font-medium text-[#35434A]'
                          : 'text-[#899497]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delayed or review notice */}
          {(isDelayed || isReview) && (
            <div className="mt-5 rounded-xl border border-[#E9D9B8] bg-[#FBF7EE] p-4 text-left">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-[#A47B3C]"
                />

                <div>
                  <p className="text-sm font-medium text-[#72582F]">
                    {isReview
                      ? 'Transaction under review'
                      : isPaid
                      ? 'Connection is taking longer than expected'
                      : 'Still waiting for payment confirmation'}
                  </p>

                  <p className="mt-1 text-sm leading-5 text-[#856F4B]">
                    {isReview
                      ? 'Your transaction is being checked. You can recheck its status below.'
                      : isPaid
                      ? 'Your payment was received, but your connection is taking longer than expected. Please do not pay again.'
                      : "Didn't receive the M-Pesa prompt, or is confirmation taking longer than expected?"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-[#E9D9B8] pt-3">
                <button
                  type="button"
                  onClick={recheck}
                  disabled={checking}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#668A8A] transition hover:text-[#557878] disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={checking ? 'animate-spin' : ''}
                  />
                  {checking ? 'Checking...' : 'Check status'}
                </button>

                {onRetry && !isReview && !isPaid && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="text-sm font-semibold text-[#668A8A] transition hover:text-[#557878]"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-[#899497]">
            <ShieldCheck size={14} />
            <span>
              {isPaid
                ? 'Your payment has been received securely.'
                : 'Keep this page open while we confirm your payment.'}
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}