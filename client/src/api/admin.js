import { api } from './http.js';

// All tenants, newest first
export function listTenants() {
  return api('/api/admin/tenants');
}

// Create a tenant. On success, data is:
// { tenant: { id, portalSlug, businessName, email }, tempPassword }
export function createTenant(values) {
  return api('/api/admin/tenants', { method: 'POST', body: values });
}

// Platform totals, tenant growth, recent tenants and recent payments
export function getAdminDashboard() {
  return api('/api/admin/dashboard');
}

// Plans: [{ id, name, description, price, billingCycle, routerLimit, isActive, features, subscribers }]
export function listPlans() {
  return api('/api/admin/plans');
}

export function createPlan(values) {
  return api('/api/admin/plans', { method: 'POST', body: values });
}

export function updatePlan(id, values) {
  return api(`/api/admin/plans/${id}`, { method: 'PUT', body: values });
}

// { summary: { revenueThisMonth, active, expiringSoon, overdue }, subscriptions: [...] }
export function listSubscriptions() {
  return api('/api/admin/subscriptions');
}

// values: { planId, amount (optional), reference (optional) }
export function recordPayment(tenantId, values) {
  return api(`/api/admin/subscriptions/${tenantId}/payments`, {
    method: 'POST',
    body: values,
  });
}

export function cancelSubscription(tenantId) {
  return api(`/api/admin/subscriptions/${tenantId}/cancel`, { method: 'POST' });
}