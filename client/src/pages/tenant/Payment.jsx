import { useEffect, useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  Save,
  CheckCircle2,
  CreditCard,
  Info,
} from 'lucide-react';
import { getPaymentSettings, savePaymentSettings } from '../../api/paymentSettings.js';

export default function TenantPayment() {
  const [settings, setSettings] = useState({
    shortcode: '',
    consumerKey: '',
    consumerSecret: '',
    passkey: '',
    env: 'sandbox',
  });
  // The server never returns the secrets, only whether they are set
  const [has, setHas] = useState({ consumerSecret: false, passkey: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await getPaymentSettings();
      if (r.ok) {
        setSettings((s) => ({
          ...s,
          shortcode: r.data.shortcode || '',
          consumerKey: r.data.consumerKey || '',
          env: r.data.env,
        }));
        setHas({
          consumerSecret: r.data.hasConsumerSecret,
          passkey: r.data.hasPasskey,
        });
      } else {
        setError(r.data?.error || 'Could not load settings.');
      }
      setLoading(false);
    })();
  }, []);

  const updateSetting = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const body = {
      shortcode: settings.shortcode,
      consumerKey: settings.consumerKey,
      env: settings.env,
    };
    // Leave a secret out to keep the stored one
    if (settings.consumerSecret) body.consumerSecret = settings.consumerSecret;
    if (settings.passkey) body.passkey = settings.passkey;

    const r = await savePaymentSettings(body);
    setSaving(false);

    if (!r.ok) {
      setError(r.data?.error || 'Could not save settings.');
      return;
    }

    setHas((h) => ({
      consumerSecret: h.consumerSecret || !!settings.consumerSecret,
      passkey: h.passkey || !!settings.passkey,
    }));
    // Clear the typed secrets so they don't sit in the page
    setSettings((s) => ({ ...s, consumerSecret: '', passkey: '' }));
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
              value={settings.shortcode}
              onChange={(value) => updateSetting('shortcode', value)}
              placeholder="e.g. 174379"
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
              placeholder={
                has.consumerSecret
                  ? 'Saved. Leave blank to keep it'
                  : 'Enter consumer secret'
              }
              type="password"
            />

            <FormField
              label="Lipa Na M-Pesa Passkey"
              value={settings.passkey}
              onChange={(value) => updateSetting('passkey', value)}
              placeholder={
                has.passkey ? 'Saved. Leave blank to keep it' : 'Enter passkey'
              }
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
                value: 'live',
                title: 'Production',
                description: 'Process real customer payments.',
              },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateSetting('env', option.value)}
                className={`rounded-lg border p-4 text-left transition ${
                  settings.env === option.value
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                    : 'border-[var(--border)] hover:bg-[var(--bg-muted)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[var(--text-primary)]">
                    {option.title}
                  </p>

                  {settings.env === option.value && (
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && (
            <p className="flex items-center gap-2 text-sm text-[var(--success)]">
              <CheckCircle2 size={17} />
              Settings saved.
            </p>
          )}

          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 sm:ml-auto"
          >
            <Save size={17} />
            {saving ? 'Saving...' : 'Save Settings'}
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