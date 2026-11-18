
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  UserRound,
  CreditCard,
  CheckCircle2,
  Info,
} from 'lucide-react';

import Select from '../../components/ui/Select';

const initialForm = {
  businessName: '',
  slug: '',
  phone: '',
  email: '',
  location: '',
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  plan: 'Starter',
};

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  hint,
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-[var(--text-primary)]"
      >
        {label}
        {required && <span className="ml-1 text-[var(--danger)]">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
      />

      {hint && (
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
        <Icon size={18} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function AddTenant() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => {
      const updated = { ...current, [name]: value };

      if (name === 'businessName') {
        updated.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }

      return updated;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    // Demo only: connect this form to the tenant creation API later.
    console.log('New tenant details:', form);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
            <CheckCircle2 size={28} />
          </div>

          <h1 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
            Tenant details captured
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            This is currently a frontend preview. The tenant has not been
            saved to the database yet.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/admin/tenants')}
              className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
            >
              Back to tenants
            </button>

            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                setSubmitted(false);
              }}
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
            >
              Add another tenant
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          to="/admin/tenants"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
        >
          <ArrowLeft size={16} />
          Back to tenants
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Add tenant
        </h1>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Register a hotspot business on your platform.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Business information */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <SectionHeader
            icon={Building2}
            title="Business information"
            description="Basic information about the hotspot business."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Business name"
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              placeholder="e.g. Joe's Wi-Fi"
              required
            />

            <FormField
              label="Business phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+254 7XX XXX XXX"
              type="tel"
              required
            />

            <FormField
              label="Business email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="business@example.com"
              type="email"
              required
            />

            <FormField
              label="Business location"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Westlands, Nairobi"
              required
            />

            <div className="sm:col-span-2">
              <FormField
                label="Customer portal address"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="joes-wifi"
                hint="This unique address identifies the tenant's customer portal."
                required
              />

              <div className="mt-2 rounded-lg bg-[var(--bg-muted)] px-3 py-2.5">
                <p className="text-xs text-[var(--text-muted)]">
                  Portal address preview
                </p>
                <p className="mt-1 break-all text-sm font-medium text-[var(--primary)]">
                  yourdomain.com/portal/{form.slug || 'business-name'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Account owner */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <SectionHeader
            icon={UserRound}
            title="Account owner"
            description="The person who will access and manage this tenant account."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Full name"
              name="ownerName"
              value={form.ownerName}
              onChange={handleChange}
              placeholder="e.g. Joe Kamau"
              required
            />

            <FormField
              label="Email address"
              name="ownerEmail"
              value={form.ownerEmail}
              onChange={handleChange}
              placeholder="joe@example.com"
              type="email"
              required
            />

            <FormField
              label="Phone number"
              name="ownerPhone"
              value={form.ownerPhone}
              onChange={handleChange}
              placeholder="+254 7XX XXX XXX"
              type="tel"
              required
            />
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-lg bg-[var(--bg-muted)] p-3">
            <Info size={16} className="mt-0.5 shrink-0 text-[var(--info)]" />
            <p className="text-xs leading-5 text-[var(--text-secondary)]">
              Account access and invitation emails will be handled when
              authentication is connected.
            </p>
          </div>
        </section>

        {/* Subscription */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <SectionHeader
            icon={CreditCard}
            title="Subscription plan"
            description="Choose the platform subscription for this business."
          />

          <div className="max-w-sm space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Select a plan
              <span className="ml-1 text-[var(--danger)]">*</span>
            </label>

            <Select
              value={form.plan}
              onChange={(value) =>
                setForm((current) => ({ ...current, plan: value }))
              }
              options={[
                { label: 'Starter', value: 'Starter' },
                { label: 'Professional', value: 'Professional' },
                { label: 'Business', value: 'Business' },
              ]}
            />
          </div>

          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Plan prices and billing cycles will be managed through
            subscription settings.
          </p>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
          <Link
            to="/admin/tenants"
            className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-center text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
          >
            Create tenant
          </button>
        </div>
      </form>
    </div>
  );
}
