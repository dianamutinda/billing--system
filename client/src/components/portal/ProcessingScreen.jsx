import { useEffect } from 'react';
import { useSessionPolling } from '../../hooks/useSessionPolling';

export function ProcessingScreen({ token, onActive, onFailed, onRetry }) {
  // Capture message (or resultDesc) from polling response
  const { status, expiresAt, message, checking, recheck } = useSessionPolling(token, true);

  useEffect(() => {
    if (status === 'active') {
      onActive(expiresAt);
    } else if (status === 'failed' || status === 'not_found') {
      onFailed(message); // <-- Ensure message is passed here!
    }
  }, [status, expiresAt, message, onActive, onFailed]);

  const isPaid = status === 'paid' || status === 'active';
  const isReview = status === 'processing';
  const isDelayed = status === 'timeout';

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      {!isReview && !isDelayed && (
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mt-8" />
      )}

      <h1 className="text-2xl font-bold text-slate-900 mt-6">
        {isReview
          ? 'Confirming Your Payment'
          : isPaid
          ? 'Activating Your Wi-Fi...'
          : 'Check Your Phone'}
      </h1>

      <p className="text-slate-500 mt-2 mb-6">
        {isReview
          ? 'We received your payment and are verifying the details. Please contact support if this takes more than a few minutes.'
          : isPaid
          ? 'Payment received! Connecting your device now...'
          : 'Enter your M-Pesa PIN on the prompt sent to your phone.'}
      </p>

      {!isReview && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-left space-y-3">
          <div className="flex items-center gap-3">
            <span className={`font-bold ${isPaid ? 'text-green-600' : 'text-blue-600'}`}>
              {isPaid ? '✓' : '1.'}
            </span>
            <span className={isPaid ? 'text-slate-900 font-medium' : 'text-slate-700'}>
              {isPaid ? 'M-Pesa payment confirmed' : 'Waiting for M-Pesa PIN confirmation...'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`font-bold ${status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
              {status === 'active' ? '✓' : '2.'}
            </span>
            <span className={isPaid ? 'text-slate-900 font-medium' : 'text-slate-400'}>
              Activating internet session
            </span>
          </div>
        </div>
      )}

      {(isDelayed || isReview) && (
        <div className="mt-4 bg-amber-50 border border-amber-200 text-sm text-amber-800 p-4 rounded-xl">
          <p>
            {isReview
              ? 'Your transaction is under review. You can recheck status below.'
              : "Didn't receive the M-Pesa prompt or taking longer than expected?"}
          </p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={recheck}
              disabled={checking}
              className="font-medium underline disabled:opacity-50"
            >
              {checking ? 'Checking...' : 'Check status now'}
            </button>
            {onRetry && !isReview && (
              <button
                type="button"
                onClick={onRetry}
                className="font-medium text-blue-700 underline"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}