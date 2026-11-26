import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Package,
  Settings2,
  Plus,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react';

import Select from '../../components/ui/Select';
import { createPlan } from '../../api/admin.js';

const initialForm = {
  name: '',
  description: '',
  price: '',
  billingCycle: 'Monthly',
  routerLimit: '1',
  status: 'Active',
  features: [
    'Package management',
    'Customer session tracking',
    'M-Pesa payment integration',
  ],
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
  min,
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
        min={min}
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

export default function CreatePlan() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [newFeature, setNewFeature] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function addFeature(event) {
    event.preventDefault();

    const feature = newFeature.trim();

    if (!feature) return;

    if (
      form.features.some(
        (item) => item.toLowerCase() === feature.toLowerCase()
      )
    ) {
      return;
    }

    setForm((current) => ({
      ...current,
      features: [...current.features, feature],
    }));

    setNewFeature('');
  }

  function removeFeature(index) {
    setForm((current) => ({
      ...current,
      features: current.features.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const r = await createPlan({
      name: form.name,
      description: form.description,
      price: Number(form.price),
      billingCycle: form.billingCycle.toLowerCase(),
      routerLimit:
        form.routerLimit === 'Unlimited' ? null : Number(form.routerLimit),
      isActive: form.status === 'Active',
      features: form.features,
    });

    setSaving(false);

    if (r.ok) setSubmitted(true);
    else setError(r.data?.error || r.error || 'Could not create the plan');
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
            <CheckCircle2 size={28} />
          </div>

          <h1 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
            Plan created
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            The plan has been saved and is now available.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/admin/subscriptions')}
              className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
            >
              Back to subscriptions
            </button>

            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                setSubmitted(false);
              }}
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
            >
              Create another plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page heading */}
      <div>
        <Link
          to="/admin/subscriptions"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
        >
          <ArrowLeft size={16} />
          Back to subscriptions
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Create subscription plan
        </h1>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Define the pricing and features available to hotspot businesses.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Plan details */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <SectionHeader
            icon={Package}
            title="Plan details"
            description="Give your subscription plan a name and description."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Plan name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Enterprise"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Plan status
              </label>

              <Select
                value={form.status}
                onChange={(value) =>
                  setForm((current) => ({ ...current, status: value }))
                }
                options={[
                  { label: 'Active', value: 'Active' },
                  { label: 'Inactive', value: 'Inactive' },
                ]}
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-[var(--text-primary)]"
              >
                Description
                <span className="ml-1 text-[var(--danger)]">*</span>
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe who this plan is designed for..."
                required
                rows={3}
                className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <SectionHeader
            icon={CreditCard}
            title="Pricing and billing"
            description="Set how much tenants pay for this subscription."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Price (KES)"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="e.g. 3500"
              type="number"
              min="1"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Billing cycle
              </label>

              <Select
                value={form.billingCycle}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    billingCycle: value,
                  }))
                }
                options={[
                  { label: 'Monthly', value: 'Monthly' },
                  { label: 'Annually', value: 'Annually' },
                ]}
              />
            </div>
          </div>

          {form.price && Number(form.price) > 0 && (
            <div className="mt-5 rounded-lg bg-[var(--bg-muted)] p-4">
              <p className="text-xs text-[var(--text-muted)]">
                Billing preview
              </p>

              <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                KES {Number(form.price).toLocaleString('en-KE')}
                <span className="ml-1 text-sm font-normal text-[var(--text-secondary)]">
                  / {form.billingCycle.toLowerCase()}
                </span>
              </p>
            </div>
          )}
        </section>

        {/* Plan limits */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <SectionHeader
            icon={Settings2}
            title="Plan limits"
            description="Define the resources included in this subscription."
          />

          <div className="max-w-sm space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Router connections
            </label>

            <Select
              value={form.routerLimit}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  routerLimit: value,
                }))
              }
              options={[
                { label: '1 router', value: '1' },
                { label: 'Up to 5 routers', value: '5' },
                { label: 'Up to 15 routers', value: '15' },
                { label: 'Unlimited routers', value: 'Unlimited' },
              ]}
            />

            <p className="text-xs text-[var(--text-muted)]">
              Maximum number of router connections a tenant can register.
            </p>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-lg bg-[var(--bg-muted)] p-3">
            <Info size={16} className="mt-0.5 shrink-0 text-[var(--info)]" />
            <p className="text-xs leading-5 text-[var(--text-secondary)]">
              Additional limits, such as user capacity or locations, can
              be introduced as your subscription system grows.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <SectionHeader
            icon={CheckCircle2}
            title="Plan features"
            description="List the capabilities included in this subscription."
          />

          <div className="space-y-3">
            {form.features.map((feature, index) => (
              <div
                key={`${feature}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3.5 py-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <CheckCircle2
                    size={16}
                    className="shrink-0 text-[var(--success)]"
                  />
                  <span className="text-sm text-[var(--text-primary)]">
                    {feature}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  aria-label={`Remove ${feature}`}
                  className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--danger)]"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newFeature}
              onChange={(event) => setNewFeature(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') addFeature(event);
              }}
              placeholder="Add a plan feature..."
              className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
            />

            <button
              type="button"
              onClick={addFeature}
              disabled={!newFeature.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Add feature
            </button>
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Form actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
          <Link
            to="/admin/subscriptions"
            className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-center text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving || form.features.length === 0}
            className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create plan'}
          </button>
        </div>
      </form>
    </div>
  );
}