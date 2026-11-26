import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Copy,
  Info,
} from 'lucide-react';

import { createTenant } from '../../api/admin.js';

const initialForm = {
  businessName: '',
  email: '',
  phone: '',
  location: '',
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

      {hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

function CopyRow({ label, value, mono = false }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the value is still visible to copy by hand
    }
  }

  return (
    <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>

      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`break-all text-sm font-medium text-[var(--text-primary)] ${
            mono ? 'font-mono' : ''
          }`}
        >
          {value}
        </span>

        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
        >
          {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export default function AddTenant() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null); // { tenant, tempPassword }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const r = await createTenant(form);

    setSaving(false);

    if (r.ok) {
      setCreated(r.data);
      setForm(initialForm);
    } else {
      setError(r.data?.error || r.error || 'Could not create the tenant');
    }
  }

  // Success: the temporary password is shown here once, and only here
  if (created) {
    const portalUrl = `${window.location.origin}/p/${created.tenant.portalSlug}`;

    return (
      <div className="mx-auto max-w-xl py-8">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              <CheckCircle2 size={28} />
            </div>

            <h1 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
              {created.tenant.businessName} has been created
            </h1>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Give these sign-in details to the tenant. They will be asked to
              choose a new password the first time they sign in.
            </p>
          </div>

          <div className="mt-6 space-y-3 rounded-lg bg-[var(--bg-muted)] p-4">
            <CopyRow label="Sign-in email" value={created.tenant.email} />
            <CopyRow label="Temporary password" value={created.tempPassword} mono />
            <CopyRow label="Customer portal" value={portalUrl} />
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--border)] p-3">
            <Info size={16} className="mt-0.5 shrink-0 text-[var(--info)]" />
            <p className="text-xs leading-5 text-[var(--text-secondary)]">
              This password is shown only once and is not stored anywhere you
              can look it up. Copy it now. If it is lost, the tenant's password
              will need to be reset.
            </p>
          </div>

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
              onClick={() => setCreated(null)}
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
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
              <Building2 size={18} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Business information
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                The tenant can update these details later in their own settings.
              </p>
            </div>
          </div>

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
              label="Sign-in email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="joe@example.com"
              type="email"
              required
              hint="The tenant signs in with this address."
            />

            <FormField
              label="Business phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="07XX XXX XXX"
              type="tel"
              hint="Optional."
            />

            <FormField
              label="Business location"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Westlands, Nairobi"
              hint="Optional."
            />
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-lg bg-[var(--bg-muted)] p-3">
            <Info size={16} className="mt-0.5 shrink-0 text-[var(--info)]" />
            <p className="text-xs leading-5 text-[var(--text-secondary)]">
              A temporary password is generated when you create the tenant. You
              will see it once on the next screen. The customer portal address
              is created automatically.
            </p>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Link
              to="/admin/tenants"
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-center text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create tenant'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}