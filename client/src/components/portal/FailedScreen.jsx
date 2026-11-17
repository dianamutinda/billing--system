export function FailedScreen({ reason, onRetry, onBackToPackages }) {
  const displayReason = reason || "We couldn't activate your session. Please try again or contact support if the problem continues.";

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mt-8">
        <span className="text-red-600 text-2xl">!</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mt-4">Session Failed</h1>
      
      {/* This renders the exact backend failure message */}
      <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
        {displayReason}
      </div>

      <p className="text-slate-500 text-xs mt-3 mb-6">
        Common causes include insufficient M-Pesa balance, entering the wrong PIN, or cancelling the prompt on your phone.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700"
      >
        Try Again
      </button>
      <button
        type="button"
        onClick={onBackToPackages}
        className="w-full mt-2 border border-slate-300 text-slate-700 font-medium py-2 rounded-lg hover:bg-slate-50"
      >
        Back to Packages
      </button>
    </div>
  );
}