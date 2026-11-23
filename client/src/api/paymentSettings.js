import { api } from './http.js';

export function getPaymentSettings() {
  return api('/api/tenant/payment-settings');
}

// Secrets are only sent when the tenant typed a new one
export function savePaymentSettings(body) {
  return api('/api/tenant/payment-settings', { method: 'PUT', body });
}