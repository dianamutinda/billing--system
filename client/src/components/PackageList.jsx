import { PACKAGES } from '../api/packages';

export function PackageList({ onSelect }) {
  return (
    <div className="max-w-md mx-auto p-4">
      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
        Stay Connected
      </p>
      <h1 className="text-2xl font-bold text-slate-900 mt-1">
        Choose Your Internet Package
      </h1>
      <p className="text-slate-500 mt-1 mb-6">Fast. Reliable. Affordable.</p>
            <div className="space-y-3">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className="border border-slate-200 rounded-xl p-4 bg-white relative"
          >
            {pkg.popular && (
              <span className="absolute top-3 right-3 bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                Most Popular
              </span>
            )}
            <div className="flex justify-between items-start pr-16">
              <div>
                <h2 className="font-semibold text-slate-900">{pkg.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{pkg.description}</p>
              </div>
              <p className="font-semibold text-slate-900 whitespace-nowrap">
                KSh {pkg.price}
              </p>
            </div>
            <button
              onClick={() => onSelect(pkg.id)}
              className="mt-3 w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700"
            >
              Buy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}