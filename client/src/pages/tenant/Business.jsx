import { useEffect, useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Save,
  Copy,
  CheckCircle2,
  Wifi,
  Info,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { getBusiness, saveBusiness } from '../../api/business.js';

export default function TenantBusiness() {
  const [business, setBusiness] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [copied, setCopied] = useState(false);
  const outlet = useOutletContext();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const r = await getBusiness();
      if (cancelled) return;
      if (r.ok) setBusiness(r.data);
      else setLoadError(r.error || 'Could not load your business settings');
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const updateField = (field, value) => {
    setBusiness((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setSaveError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError('');

    const r = await saveBusiness({
      businessName: business.businessName,
      phone: business.phone,
      location: business.location,
      description: business.description,
      portalMessage: business.portalMessage,
    });

    setSaving(false);
    if (r.ok) {
      setSaved(true);
      // The server trims the name, so send the sidebar the same value
      outlet?.setBusinessName?.(business.businessName.trim());
    }
    else setSaveError(r.error || 'Could not save your changes');
  };

  // The real customer portal address, built from wherever the app is running
  const portalUrl = business
    ? `${window.location.origin}/p/${business.portalSlug}`
    : '';

  const copyPortalUrl = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link is still visible to copy by hand
    }
  };

  if (loadError) {
    return (
      <p className="mx-auto max-w-5xl rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
        {loadError}
      </p>
    );
  }

  if (!business) {
    return (
      <p className="mx-auto max-w-5xl text-sm text-[var(--text-secondary)]">
        Loading…
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Business Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage your business profile and customer-facing information.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business profile */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[var(--primary-soft)] p-2">
              <Building2 size={20} className="text-[var(--primary)]" />
            </div>

            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                Business Profile
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Basic information about your hotspot business.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <FormField
              label="Business Name"
              value={business.businessName}
              onChange={(value) => updateField('businessName', value)}
              placeholder="Enter business name"
            />

            <FormField
              label="Login Email"
              value={business.email}
              type="email"
              icon={Mail}
              disabled
              hint="This is your sign-in email and can't be changed here."
            />

            <FormField
              label="Business Phone"
              value={business.phone}
              onChange={(value) => updateField('phone', value)}
              placeholder="07XXXXXXXX"
              icon={Phone}
            />

            <FormField
              label="Business Location"
              value={business.location}
              onChange={(value) => updateField('location', value)}
              placeholder="Enter business location"
              icon={MapPin}
            />

            <div className="sm:col-span-2">
              <TextAreaField
                label="Business Description"
                value={business.description}
                onChange={(value) => updateField('description', value)}
                placeholder="Tell customers about your Wi-Fi service."
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* Customer portal */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[var(--primary-soft)] p-2">
              <Wifi size={20} className="text-[var(--primary)]" />
            </div>

            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                Customer Portal
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Customize the information customers see when connecting.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <TextAreaField
              label="Welcome Message"
              value={business.portalMessage}
              onChange={(value) => updateField('portalMessage', value)}
              placeholder="Welcome message shown on your customer portal."
              rows={3}
            />

            <div className="rounded-lg bg-[var(--bg-muted)] p-4">
              <div className="flex items-center gap-2">
                <Globe size={17} className="text-[var(--text-secondary)]" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Your Customer Portal
                </p>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <p className="min-w-0 flex-1 break-all text-sm text-[var(--primary)]">
                  {portalUrl}
                </p>

                <button
                  type="button"
                  onClick={copyPortalUrl}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-muted)]"
                >
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Customers use this address to view your internet packages. Keep
                it the same once you print it on a QR code or poster.
              </p>
            </div>
          </div>
        </section>

        {/* Information note */}
        <div className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] p-4">
          <Info
            size={18}
            className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
          />
          <p className="text-sm leading-5 text-[var(--text-secondary)]">
            Your business profile belongs to your tenant account. Changes here
            only affect your own customer portal and business information.
          </p>
        </div>

        {/* Save */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {saved && (
              <p className="flex items-center gap-2 text-sm text-[var(--success)]">
                <CheckCircle2 size={17} />
                Settings saved.
              </p>
            )}
            {saveError && (
              <p className="text-sm text-red-600">{saveError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60 sm:ml-auto"
          >
            <Save size={17} />
            {saving ? 'Saving…' : 'Save Changes'}
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
  icon: Icon,
  hint,
  disabled = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
        {label}
      </span>

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
        )}

        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2.5 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60 ${
            Icon ? 'pl-9' : 'pl-3'
          }`}
        />
      </div>

      {hint && (
        <span className="mt-1.5 block text-xs text-[var(--text-muted)]">
          {hint}
        </span>
      )}
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
      />
    </label>
  );
}