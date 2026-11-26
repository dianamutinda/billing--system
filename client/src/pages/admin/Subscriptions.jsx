import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Search,
  Plus,
  Users,
  X,
  Eye,
  Pencil,
  Ban,
} from 'lucide-react';

import Select from '../../components/ui/Select';
import DropdownMenu from '../../components/ui/DropdownMenu';
import {
  listSubscriptions,
  listPlans,
  recordPayment,
  cancelSubscription,
  updatePlan,
} from '../../api/admin.js';

const formatCurrency = (amount) =>
  `KES ${Number(amount).toLocaleString('en-KE')}`;

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Nairobi',
      })
    : '—';

const cycleLabel = (cycle) =>
  cycle === 'annually' ? 'Annually' : cycle === 'monthly' ? 'Monthly' : '—';

const inputClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]';

function SummaryCard({ label, value, description, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>
          <h3 className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
            {value}
          </h3>
        </div>

        <div className="rounded-lg bg-[var(--primary-soft)] p-3">
          <Icon size={20} className="text-[var(--primary)]" />
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)]">{description}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Active: 'bg-[var(--primary-soft)] text-[var(--success)]',
    'Expiring soon': 'bg-[var(--bg-muted)] text-[var(--warning)]',
    Overdue: 'bg-[var(--bg-muted)] text-[var(--danger)]',
    'No plan': 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || styles['No plan']
      }`}
    >
      {status}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--text-secondary)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState(null);
  const [summary, setSummary] = useState(null);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('subscriptions');

  const [selectedSubscription, setSelectedSubscription] = useState(null);

  // Record payment modal
  const [payTenant, setPayTenant] = useState(null);
  const [payForm, setPayForm] = useState({ planId: '', amount: '', reference: '' });
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  // Edit plan modal
  const [planForm, setPlanForm] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planError, setPlanError] = useState('');

  const load = useCallback(async () => {
    const [subs, planList] = await Promise.all([listSubscriptions(), listPlans()]);

    if (subs.ok && planList.ok) {
      setSubscriptions(subs.data.subscriptions);
      setSummary(subs.data.summary);
      setPlans(planList.data);
      setError('');
    } else {
      setError(
        subs.data?.error || planList.data?.error || subs.error || planList.error ||
          'Could not load subscriptions'
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const list = subscriptions || [];
  const activePlans = plans.filter((p) => p.isActive);

  const filteredSubscriptions = list.filter((s) => {
    const term = search.toLowerCase();
    const matchesSearch =
      s.tenant.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      (s.plan || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function openRecordPayment(subscription) {
    const plan =
      activePlans.find((p) => p.id === subscription.planId) || activePlans[0];

    setPayTenant(subscription);
    setPayForm({
      planId: plan ? plan.id : '',
      amount: plan ? String(plan.price) : '',
      reference: '',
    });
    setPayError('');
  }

  function choosePayPlan(planId) {
    const plan = activePlans.find((p) => p.id === planId);
    setPayForm((current) => ({
      ...current,
      planId,
      amount: plan ? String(plan.price) : current.amount,
    }));
  }

  async function submitPayment(e) {
    e.preventDefault();
    setPaying(true);
    setPayError('');

    const r = await recordPayment(payTenant.tenantId, {
      planId: payForm.planId,
      amount: payForm.amount === '' ? undefined : Number(payForm.amount),
      reference: payForm.reference,
    });

    setPaying(false);

    if (r.ok) {
      setPayTenant(null);
      await load();
    } else {
      setPayError(r.data?.error || r.error || 'Could not record the payment');
    }
  }

  async function handleCancel(subscription) {
    const ok = window.confirm(
      `Remove ${subscription.tenant}'s plan? Their payment history is kept.`
    );
    if (!ok) return;

    const r = await cancelSubscription(subscription.tenantId);
    if (r.ok) await load();
    else setError(r.data?.error || r.error || 'Could not cancel the subscription');
  }

  function openEditPlan(plan) {
    setPlanForm({
      id: plan.id,
      name: plan.name,
      price: String(plan.price),
      description: plan.description,
      featuresText: plan.features.join('\n'),
      isActive: plan.isActive,
      billingCycle: plan.billingCycle,
      routerLimit: plan.routerLimit,
    });
    setPlanError('');
  }

  async function savePlan(e) {
    e.preventDefault();
    setSavingPlan(true);
    setPlanError('');

    const r = await updatePlan(planForm.id, {
      name: planForm.name,
      description: planForm.description,
      price: Number(planForm.price),
      billingCycle: planForm.billingCycle,
      routerLimit: planForm.routerLimit,
      isActive: planForm.isActive,
      features: planForm.featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
    });

    setSavingPlan(false);

    if (r.ok) {
      setPlanForm(null);
      await load();
    } else {
      setPlanError(r.data?.error || r.error || 'Could not save the plan');
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage plans and record what tenants pay you.
          </p>
        </div>

        <Link
          to="/admin/subscriptions/plans/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
        >
          <Plus size={17} />
          Create Plan
        </Link>
      </div>

      {error && (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
          {error}
        </p>
      )}

      {!subscriptions && !error && (
        <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
      )}

      {subscriptions && summary && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Revenue This Month"
              value={formatCurrency(summary.revenueThisMonth)}
              description="Payments you recorded this month"
              icon={Wallet}
            />
            <SummaryCard
              label="Active Subscriptions"
              value={summary.active}
              description="Plans that have not expired"
              icon={CheckCircle2}
            />
            <SummaryCard
              label="Expiring Soon"
              value={summary.expiringSoon}
              description="Expire within 7 days"
              icon={Clock3}
            />
            <SummaryCard
              label="Overdue"
              value={summary.overdue}
              description="Plan has expired"
              icon={AlertCircle}
            />
          </section>

          <div className="flex gap-6 overflow-x-auto border-b border-[var(--border)]">
            {[
              ['subscriptions', 'Tenant Subscriptions'],
              ['plans', 'Subscription Plans'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`shrink-0 border-b-2 pb-3 text-sm font-medium ${
                  activeTab === key
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--text-secondary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'subscriptions' && (
            <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-[var(--text-primary)]">
                    All Tenants
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Each tenant's plan and when it renews.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                      type="text"
                      placeholder="Search tenants..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] sm:w-56"
                    />
                  </div>

                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    width="w-full sm:w-44"
                    options={[
                      { label: 'All statuses', value: 'All' },
                      { label: 'Active', value: 'Active' },
                      { label: 'Expiring soon', value: 'Expiring soon' },
                      { label: 'Overdue', value: 'Overdue' },
                      { label: 'No plan', value: 'No plan' },
                    ]}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                      <th className="px-5 py-4 font-medium">Tenant</th>
                      <th className="px-5 py-4 font-medium">Plan</th>
                      <th className="px-5 py-4 font-medium">Amount</th>
                      <th className="px-5 py-4 font-medium">Billing</th>
                      <th className="px-5 py-4 font-medium">Renewal Date</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 font-medium">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSubscriptions.map((s) => (
                      <tr
                        key={s.tenantId}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-muted)]/50"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {s.tenant}
                          </p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {s.email}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                          {s.plan || '—'}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-[var(--text-primary)]">
                          {s.amount != null ? formatCurrency(s.amount) : '—'}
                        </td>
                        <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                          {cycleLabel(s.billingCycle)}
                        </td>
                        <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                          {formatDate(s.expiresAt)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={s.status} />
                        </td>

                        <td className="px-5 py-4">
                          <DropdownMenu
                            items={[
                              {
                                label: 'View details',
                                icon: Eye,
                                onClick: () => setSelectedSubscription(s),
                              },
                              {
                                label: 'Record payment',
                                icon: Wallet,
                                onClick: () => openRecordPayment(s),
                              },
                              ...(s.planId
                                ? [
                                    {
                                      label: 'Remove plan',
                                      icon: Ban,
                                      danger: true,
                                      onClick: () => handleCancel(s),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </td>
                      </tr>
                    ))}

                    {filteredSubscriptions.length === 0 && (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-5 py-10 text-center text-sm text-[var(--text-muted)]"
                        >
                          {list.length === 0
                            ? 'No tenants yet.'
                            : 'No tenants match your search.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[var(--border)] px-5 py-4">
                <p className="text-xs text-[var(--text-muted)]">
                  Showing {filteredSubscriptions.length} of {list.length} tenants
                </p>
              </div>
            </section>
          )}

          {activeTab === 'plans' && (
            <section className="space-y-5">
              <div>
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Available Plans
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  The plans hotspot businesses can subscribe to.
                </p>
              </div>

              {plans.length === 0 ? (
                <p className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-sm text-[var(--text-secondary)]">
                  No plans yet. Use "Create Plan" to add your first one.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="relative flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5"
                    >
                      {!plan.isActive && (
                        <span className="absolute right-4 top-4 rounded-full bg-[var(--bg-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                          Inactive
                        </span>
                      )}

                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        {plan.name}
                      </h3>
                      <p className="mt-2 min-h-10 text-sm text-[var(--text-secondary)]">
                        {plan.description}
                      </p>

                      <div className="mt-5">
                        <span className="text-3xl font-bold text-[var(--text-primary)]">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="ml-1 text-sm text-[var(--text-muted)]">
                          / {plan.billingCycle === 'annually' ? 'year' : 'month'}
                        </span>
                      </div>

                      <div className="mt-5 flex items-center gap-2 border-y border-[var(--border)] py-4 text-sm text-[var(--text-secondary)]">
                        <Users size={17} />
                        {plan.subscribers}{' '}
                        {plan.subscribers === 1 ? 'subscriber' : 'subscribers'}
                      </div>

                      <div className="flex-1 space-y-3 py-5">
                        <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                          <CheckCircle2
                            size={16}
                            className="mt-0.5 shrink-0 text-[var(--success)]"
                          />
                          {plan.routerLimit
                            ? `Up to ${plan.routerLimit} router${plan.routerLimit === 1 ? '' : 's'}`
                            : 'Unlimited routers'}
                        </div>

                        {plan.features.map((feature) => (
                          <div
                            key={feature}
                            className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                          >
                            <CheckCircle2
                              size={16}
                              className="mt-0.5 shrink-0 text-[var(--success)]"
                            />
                            {feature}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditPlan(plan)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                      >
                        <Pencil size={15} />
                        Edit Plan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Subscription details */}
      {selectedSubscription && (
        <Modal
          title="Subscription Details"
          onClose={() => setSelectedSubscription(null)}
        >
          <div className="space-y-4">
            {[
              ['Tenant', selectedSubscription.tenant],
              ['Email', selectedSubscription.email],
              ['Plan', selectedSubscription.plan || '—'],
              [
                'Amount',
                selectedSubscription.amount != null
                  ? formatCurrency(selectedSubscription.amount)
                  : '—',
              ],
              ['Billing cycle', cycleLabel(selectedSubscription.billingCycle)],
              ['Renewal date', formatDate(selectedSubscription.expiresAt)],
              ['Status', selectedSubscription.status],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 border-b border-[var(--border)] pb-3 text-sm"
              >
                <span className="text-[var(--text-secondary)]">{label}</span>
                <span className="text-right font-medium text-[var(--text-primary)]">
                  {value}
                </span>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setSelectedSubscription(null)}
              className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Record payment */}
      {payTenant && (
        <Modal
          title={`Record payment: ${payTenant.tenant}`}
          onClose={() => setPayTenant(null)}
        >
          {activePlans.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              There are no active plans yet. Create a plan first.
            </p>
          ) : (
            <form onSubmit={submitPayment} className="space-y-4">
              <FormField label="Plan">
                <Select
                  value={payForm.planId}
                  onChange={choosePayPlan}
                  options={activePlans.map((p) => ({
                    label: `${p.name} (${formatCurrency(p.price)} / ${
                      p.billingCycle === 'annually' ? 'year' : 'month'
                    })`,
                    value: p.id,
                  }))}
                />
              </FormField>

              <FormField label="Amount received (KES)">
                <input
                  type="number"
                  min="0"
                  value={payForm.amount}
                  onChange={(e) =>
                    setPayForm({ ...payForm, amount: e.target.value })
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Reference (optional)">
                <input
                  type="text"
                  maxLength={100}
                  value={payForm.reference}
                  onChange={(e) =>
                    setPayForm({ ...payForm, reference: e.target.value })
                  }
                  placeholder="e.g. M-Pesa code"
                  className={inputClass}
                />
              </FormField>

              <p className="text-xs text-[var(--text-muted)]">
                This extends the tenant's plan by one billing period.
                Renewing the same plan before it expires continues from the
                current renewal date.
              </p>

              {payError && <p className="text-sm text-red-600">{payError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayTenant(null)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-secondary)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={paying || !payForm.planId}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-60"
                >
                  {paying ? 'Saving…' : 'Record payment'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Edit plan */}
      {planForm && (
        <Modal title={`Edit ${planForm.name}`} onClose={() => setPlanForm(null)}>
          <form onSubmit={savePlan} className="space-y-4">
            <FormField label="Plan name">
              <input
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                className={inputClass}
                required
              />
            </FormField>

            <FormField label="Price (KES)">
              <input
                type="number"
                min="1"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                className={inputClass}
                required
              />
            </FormField>

            <FormField label="Description">
              <textarea
                rows="2"
                value={planForm.description}
                onChange={(e) =>
                  setPlanForm({ ...planForm, description: e.target.value })
                }
                className={inputClass}
                required
              />
            </FormField>

            <FormField label="Features (one per line)">
              <textarea
                rows="5"
                value={planForm.featuresText}
                onChange={(e) =>
                  setPlanForm({ ...planForm, featuresText: e.target.value })
                }
                className={inputClass}
              />
            </FormField>

            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={planForm.isActive}
                onChange={(e) =>
                  setPlanForm({ ...planForm, isActive: e.target.checked })
                }
              />
              Plan is active (can be assigned to tenants)
            </label>

            {planError && <p className="text-sm text-red-600">{planError}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPlanForm(null)}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-secondary)]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingPlan}
                className="rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-60"
              >
                {savingPlan ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}