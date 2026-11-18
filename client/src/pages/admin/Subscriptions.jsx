
import { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Search,
  Plus,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  X,
  Eye,
  Pencil,
  Ban,
} from 'lucide-react';

import Select from '../../components/ui/Select';
import { Link } from 'react-router-dom';

const initialSubscriptions = [
  {
    id: 1,
    tenant: "Joe's Wi-Fi",
    email: 'joe@example.com',
    plan: 'Professional',
    amount: 2500,
    billing: 'Monthly',
    startDate: '01 Nov 2026',
    renewalDate: '01 Dec 2026',
    status: 'Active',
  },
  {
    id: 2,
    tenant: 'Metro Hotspot',
    email: 'metro@example.com',
    plan: 'Starter',
    amount: 1000,
    billing: 'Monthly',
    startDate: '05 Nov 2026',
    renewalDate: '05 Dec 2026',
    status: 'Active',
  },
  {
    id: 3,
    tenant: 'FastLink Networks',
    email: 'fastlink@example.com',
    plan: 'Business',
    amount: 5000,
    billing: 'Monthly',
    startDate: '10 Nov 2026',
    renewalDate: '10 Dec 2026',
    status: 'Active',
  },
  {
    id: 4,
    tenant: 'City Connect',
    email: 'city@example.com',
    plan: 'Starter',
    amount: 1000,
    billing: 'Monthly',
    startDate: '12 Nov 2026',
    renewalDate: '12 Dec 2026',
    status: 'Pending',
  },
  {
    id: 5,
    tenant: 'SkyNet Wi-Fi',
    email: 'skynet@example.com',
    plan: 'Professional',
    amount: 2500,
    billing: 'Monthly',
    startDate: '01 Oct 2026',
    renewalDate: '01 Nov 2026',
    status: 'Overdue',
  },
];

const initialPlans = [
  {
    name: 'Starter',
    price: 1000,
    description: 'For small hotspot businesses getting started.',
    features: [
      '1 router connection',
      'Package management',
      'Customer session tracking',
      'M-Pesa payment integration',
    ],
    subscribers: 86,
  },
  {
    name: 'Professional',
    price: 2500,
    description: 'For growing hotspot businesses.',
    features: [
      'Up to 5 router connections',
      'Advanced transaction reports',
      'Customer management',
      'Priority support',
    ],
    subscribers: 104,
    popular: true,
  },
  {
    name: 'Business',
    price: 5000,
    description: 'For larger hotspot operations.',
    features: [
      'Up to 15 router connections',
      'Advanced analytics',
      'Multiple locations',
      'Priority support',
    ],
    subscribers: 31,
  },
];

const formatCurrency = (amount) =>
  `KES ${Number(amount).toLocaleString('en-KE')}`;

function SummaryCard({ label, value, description, icon: Icon, trend }) {
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

      <div className="mt-4 flex items-center gap-2 text-xs">
        {trend && (
          <span className={`flex items-center gap-1 font-semibold ${
            trend === 'up'
              ? 'text-[var(--success)]'
              : 'text-[var(--danger)]'
          }`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend === 'up' ? '+12.5%' : '-2.1%'}
          </span>
        )}

        <span className="text-[var(--text-muted)]">{description}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Active: 'bg-[var(--primary-soft)] text-[var(--success)]',
    Pending: 'bg-[var(--bg-muted)] text-[var(--warning)]',
    Overdue: 'bg-[var(--bg-muted)] text-[var(--danger)]',
    Cancelled: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
      styles[status] || styles.Cancelled
    }`}>
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
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>

          <button
            type="button"
            onClick={onClose}
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
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [plans, setPlans] = useState(initialPlans);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('subscriptions');

  const [openMenu, setOpenMenu] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planForm, setPlanForm] = useState(null);

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const matchesSearch =
      subscription.tenant.toLowerCase().includes(search.toLowerCase()) ||
      subscription.plan.toLowerCase().includes(search.toLowerCase()) ||
      subscription.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || subscription.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = subscriptions.filter((item) => item.status === 'Active').length;
  const pendingCount = subscriptions.filter((item) => item.status === 'Pending').length;
  const overdueCount = subscriptions.filter((item) => item.status === 'Overdue').length;

  const monthlyRevenue = subscriptions
    .filter((item) => item.status === 'Active')
    .reduce((total, item) => total + item.amount, 0);

  function updateSubscriptionStatus(id, status) {
    setSubscriptions((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
    setOpenMenu(null);
  }

  function openEditPlan(plan) {
    setPlanForm({
      ...plan,
      featuresText: plan.features.join('\n'),
    });
    setSelectedPlan(plan.name);
  }

  function savePlan(e) {
    e.preventDefault();

    const updatedPlan = {
      ...planForm,
      price: Number(planForm.price),
      features: planForm.featuresText
        .split('\n')
        .map((feature) => feature.trim())
        .filter(Boolean),
    };

    setPlans((current) =>
      current.map((plan) =>
        plan.name === selectedPlan ? updatedPlan : plan
      )
    );

    setPlanForm(null);
    setSelectedPlan(null);
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage SaaS plans, tenant subscriptions and recurring revenue.
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Monthly Revenue" value={formatCurrency(monthlyRevenue)} description="From active subscriptions" icon={Wallet} trend="up" />
        <SummaryCard label="Active Subscriptions" value={activeCount} description="Currently subscribed" icon={CheckCircle2} />
        <SummaryCard label="Pending Payments" value={pendingCount} description="Awaiting payment" icon={Clock3} />
        <SummaryCard label="Overdue Subscriptions" value={overdueCount} description="Require attention" icon={AlertCircle} />
      </section>

      <div className="flex gap-6 overflow-x-auto border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setActiveTab('subscriptions')}
          className={`shrink-0 border-b-2 pb-3 text-sm font-medium ${
            activeTab === 'subscriptions'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-secondary)]'
          }`}
        >
          Tenant Subscriptions
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`shrink-0 border-b-2 pb-3 text-sm font-medium ${
            activeTab === 'plans'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-secondary)]'
          }`}
        >
          Subscription Plans
        </button>
      </div>

      {activeTab === 'subscriptions' && (
        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">All Subscriptions</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                View and monitor tenant billing records.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
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
                width="w-full sm:w-40"
                options={[
                  { label: 'All statuses', value: 'All' },
                  { label: 'Active', value: 'Active' },
                  { label: 'Pending', value: 'Pending' },
                  { label: 'Overdue', value: 'Overdue' },
                  { label: 'Cancelled', value: 'Cancelled' },
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
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-muted)]/50">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{subscription.tenant}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{subscription.email}</p>
                    </td>

                    <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">{subscription.plan}</td>
                    <td className="px-5 py-4 text-sm font-medium text-[var(--text-primary)]">{formatCurrency(subscription.amount)}</td>
                    <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">{subscription.billing}</td>
                    <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">{subscription.renewalDate}</td>
                    <td className="px-5 py-4"><StatusBadge status={subscription.status} /></td>

                    <td className="relative px-5 py-4">
                      <button
                        type="button"
                        aria-label={`More options for ${subscription.tenant}`}
                        onClick={() => setOpenMenu(openMenu === subscription.id ? null : subscription.id)}
                        className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openMenu === subscription.id && (
                        <div className="absolute right-8 top-12 z-30 w-48 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setOpenMenu(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                          >
                            <Eye size={15} /> View details
                          </button>

                          {subscription.status !== 'Active' && (
                            <button
                              type="button"
                              onClick={() => updateSubscriptionStatus(subscription.id, 'Active')}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--success)] hover:bg-[var(--bg-muted)]"
                            >
                              <CheckCircle2 size={15} /> Mark active
                            </button>
                          )}

                          {subscription.status !== 'Cancelled' && (
                            <button
                              type="button"
                              onClick={() => updateSubscriptionStatus(subscription.id, 'Cancelled')}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-[var(--bg-muted)]"
                            >
                              <Ban size={15} /> Cancel subscription
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredSubscriptions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
                      No subscriptions match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[var(--border)] px-5 py-4">
            <p className="text-xs text-[var(--text-muted)]">
              Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
            </p>
          </div>
        </section>
      )}

      {activeTab === 'plans' && (
        <section className="space-y-5">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Available Plans</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Manage the plans hotspot businesses can subscribe to.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border bg-[var(--bg-surface)] p-5 ${
                  plan.popular ? 'border-[var(--primary)]' : 'border-[var(--border)]'
                }`}
              >
                {plan.popular && (
                  <span className="absolute right-4 top-4 rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                    Most popular
                  </span>
                )}

                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{plan.name}</h3>
                <p className="mt-2 min-h-10 text-sm text-[var(--text-secondary)]">{plan.description}</p>

                <div className="mt-5">
                  <span className="text-3xl font-bold text-[var(--text-primary)]">{formatCurrency(plan.price)}</span>
                  <span className="ml-1 text-sm text-[var(--text-muted)]">/ month</span>
                </div>

                <div className="mt-5 flex items-center gap-2 border-y border-[var(--border)] py-4 text-sm text-[var(--text-secondary)]">
                  <Users size={17} />
                  {plan.subscribers} subscribers
                </div>

                <div className="flex-1 space-y-3 py-5">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--success)]" />
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
        </section>
      )}

      {selectedSubscription && (
        <Modal
          title="Subscription Details"
          onClose={() => setSelectedSubscription(null)}
        >
          <div className="space-y-4">
            {[
              ['Tenant', selectedSubscription.tenant],
              ['Email', selectedSubscription.email],
              ['Plan', selectedSubscription.plan],
              ['Amount', formatCurrency(selectedSubscription.amount)],
              ['Billing cycle', selectedSubscription.billing],
              ['Start date', selectedSubscription.startDate],
              ['Renewal date', selectedSubscription.renewalDate],
              ['Status', selectedSubscription.status],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-[var(--border)] pb-3 text-sm">
                <span className="text-[var(--text-secondary)]">{label}</span>
                <span className="text-right font-medium text-[var(--text-primary)]">{value}</span>
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

      {planForm && (
        <Modal title={`Edit ${selectedPlan} Plan`} onClose={() => {
          setPlanForm(null);
          setSelectedPlan(null);
        }}>
          <form onSubmit={savePlan} className="space-y-4">
            <FormField label="Plan name">
              <input
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                className="form-input"
                required
              />
            </FormField>

            <FormField label="Monthly price (KES)">
              <input
                type="number"
                min="0"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                className="form-input"
                required
              />
            </FormField>

            <FormField label="Description">
              <textarea
                rows="2"
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                className="form-input"
                required
              />
            </FormField>

            <FormField label="Features (one per line)">
              <textarea
                rows="5"
                value={planForm.featuresText}
                onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
                className="form-input"
                required
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPlanForm(null);
                  setSelectedPlan(null);
                }}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-secondary)]"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
