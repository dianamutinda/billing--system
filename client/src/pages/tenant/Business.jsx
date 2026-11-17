
import { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Save,
  CheckCircle2,
  Wifi,
  Info,
} from 'lucide-react';

export default function TenantBusiness() {
  const [business, setBusiness] = useState({
    name: "Joe's Wi-Fi",
    slug: 'joes-wifi',
    phone: '0712345678',
    email: 'hello@joeswifi.co.ke',
    location: 'Westlands, Nairobi',
    description: 'Affordable and reliable internet access.',
    portalMessage: 'Welcome! Choose a package and get connected.',
  });

  const [saved, setSaved] = useState(false);

  const updateField = (field, value) => {
    setBusiness((current) => ({
      ...current,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Temporary UI demonstration.
    // Connect to the tenant business settings API later.
    setSaved(true);
  };

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
              value={business.name}
              onChange={(value) => updateField('name', value)}
              placeholder="Enter business name"
            />

            <FormField
              label="Portal URL Slug"
              value={business.slug}
              onChange={(value) => updateField('slug', value)}
              placeholder="your-business"
              hint="Used to identify your customer portal."
            />

            <FormField
              label="Business Phone"
              value={business.phone}
              onChange={(value) => updateField('phone', value)}
              placeholder="07XXXXXXXX"
              icon={Phone}
            />

            <FormField
              label="Business Email"
              value={business.email}
              onChange={(value) => updateField('email', value)}
              placeholder="business@example.com"
              type="email"
              icon={Mail}
            />

            <div className="sm:col-span-2">
              <FormField
                label="Business Location"
                value={business.location}
                onChange={(value) => updateField('location', value)}
                placeholder="Enter business location"
                icon={MapPin}
              />
            </div>

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

              <p className="mt-2 break-all text-sm text-[var(--primary)]">
                yourdomain.com/portal/{business.slug || 'your-business'}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Customers use this address to view your available internet packages.
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
            should only affect your own customer portal and business information.
          </p>
        </div>

        {/* Save */}
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
            Save Changes
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
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2.5 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] ${
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
