import { api } from './http.js';

// Load the business profile:
// { businessName, email, portalSlug, phone, location, description, portalMessage }
export function getBusiness() {
  return api('/api/tenant/business');
}

// Save the editable fields (email and portal link can't be changed here)
export function saveBusiness(values) {
  return api('/api/tenant/business', { method: 'PUT', body: values });
}