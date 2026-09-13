export function FailedScreen({ onRetry, onBackToPackages }) {
  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mt-8">
        <span className="text-red-600 text-2xl">!</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mt-4">Session Failed</h1>
      <p className="text-slate-500 mt-1 mb-6">
        We couldn't activate your session. Please try again or contact
        support if the problem continues.
      </p>

      <div className="bg-blue-50 text-sm text-blue-700 p-3 rounded-lg text-left mb-6">
        <p className="font-medium mb-1">Possible reasons:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Incorrect phone number</li>
          <li>Payment not confirmed</li>
          <li>Network issue</li>
        </ul>
      </div>

      <button
        onClick={onRetry}
        className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700"
      >
        Try Again
      </button>
      <button
        onClick={onBackToPackages}
        className="w-full mt-2 border border-slate-300 text-slate-700 font-medium py-2 rounded-lg"
      >
        Back to Packages
      </button>
    </div>
  );
}