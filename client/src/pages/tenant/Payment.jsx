
import { useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  Save,
  CheckCircle2,
  CreditCard,
  Info,
} from 'lucide-react';

export default function TenantPayment() {
  const [settings, setSettings] = useState({
    paybill: '',
    accountNumber: '',
    consumerKey: '',
    consumerSecret: '',
    passkey: '',
    environment: 'sandbox',
  });

  const [saved, setSaved] = useState(false);

  const updateSetting = (field, value) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Temporary frontend demonstration.
    // Actual credentials must be saved securely through the backend.
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Payment Settings
        </h1>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Configure how your customers pay for internet access.
        </p>
      </div>

      {/* Payment provider */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <h2 className="font-semibold text-[var(--text-primary)]">
          Payment Provider
        </h2>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Choose the payment method your business uses to receive payments.
        </p>

        <div className="mt-5 flex items-center gap-4 rounded-lg border border-[var(--primary)] bg-[var(--primary-soft)] p-4">
          <div className="flex size-11 items-center justify-center rounded-lg bg-[var(--success)]/10">
            <Smartphone size={22} className="text-[var(--success)]" />
          </div>

          <div className="flex-1">
            <p className="font-medium text-[var(--text-primary)]">
              M-Pesa Daraja
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Accept customer payments through M-Pesa STK Push.
            </p>
          </div>

          <CheckCircle2 size={20} className="text-[var(--primary)]" />
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business details */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[var(--primary-soft)] p-2">
              <CreditCard size={19} className="text-[var(--primary)]" />
            </div>

            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                Business Details
              </h2>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Enter the M-Pesa business details used to receive payments.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <FormField
              label="Paybill / Till Number"
              value={settings.paybill}
              onChange={(value) => updateSetting('paybill', value)}
              placeholder="Enter business number"
            />

            <FormField
              label="Account Number"
              value={settings.accountNumber}
              onChange={(value) => updateSetting('accountNumber', value)}
              placeholder="Enter account number"
            />
          </div>
        </section>

        {/* API credentials */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[var(--primary-soft)] p-2">
              <ShieldCheck size={19} className="text-[var(--primary)]" />
            </div>

            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                Daraja API Credentials
              </h2>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Configure the API credentials associated with your M-Pesa business.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <FormField
              label="Consumer Key"
              value={settings.consumerKey}
              onChange={(value) => updateSetting('consumerKey', value)}
              placeholder="Enter consumer key"
            />

            <FormField
              label="Consumer Secret"
              value={settings.consumerSecret}
              onChange={(value) => updateSetting('consumerSecret', value)}
              placeholder="Enter consumer secret"
              type="password"
            />

            <FormField
              label="Lipa Na M-Pesa Passkey"
              value={settings.passkey}
              onChange={(value) => updateSetting('passkey', value)}
              placeholder="Enter passkey"
              type="password"
            />
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-lg bg-[var(--bg-muted)] p-3">
            <Info
              size={17}
              className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
            />

            <p className="text-xs leading-5 text-[var(--text-secondary)]">
              Credentials are sensitive. Store them securely on the backend.
              Never expose consumer secrets or passkeys in frontend code or browser storage.
            </p>
          </div>
        </section>

        {/* Environment */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <h2 className="font-semibold text-[var(--text-primary)]">
            Payment Environment
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Select the Daraja environment used for processing payments.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              {
                value: 'sandbox',
                title: 'Sandbox',
                description: 'Test payment requests without processing live payments.',
              },
              {
                value: 'production',
                title: 'Production',
                description: 'Process real customer payments.',
              },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateSetting('environment', option.value)}
                className={`rounded-lg border p-4 text-left transition ${
                  settings.environment === option.value
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                    : 'border-[var(--border)] hover:bg-[var(--bg-muted)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[var(--text-primary)]">
                    {option.title}
                  </p>

                  {settings.environment === option.value && (
                    <CheckCircle2
                      size={18}
                      className="text-[var(--primary)]"
                    />
                  )}
                </div>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Save settings */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {saved && (
            <p className="flex items-center gap-2 text-sm text-[var(--success)]">
              <CheckCircle2 size={17} />
              Demo settings saved.
            </p>
          )}

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 sm:ml-auto"
          >
            <Save size={17} />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
      />
    </label>
  );
}
