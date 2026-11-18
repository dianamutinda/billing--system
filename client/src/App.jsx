
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Portal from './pages/portal/Portal';

import TenantLayout from './layouts/TenantLayout';
import AdminLayout from './layouts/AdminLayout';

import TenantDashboard from './pages/tenant/Dashboard';
import TenantSessions from './pages/tenant/Sessions';
import TenantPackages from './pages/tenant/Packages';
import TenantTransactions from './pages/tenant/Transactions';
import TenantPayment from './pages/tenant/Payment';
import TenantBusiness from './pages/tenant/Business';

import AdminDashboard from './pages/admin/Dashboard';
import AdminTenants from './pages/admin/Tenants';
import AddTenant from './pages/admin/AddTenant';
import AdminSubscriptions from './pages/admin/Subscriptions';
import CreatePlan from './pages/admin/CreatePlan';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Customer Wi-Fi Portal */}
        <Route path="/" element={<Portal />} />

        {/* Tenant Dashboard */}
        <Route path="/tenant" element={<TenantLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TenantDashboard />} />
          <Route path="sessions" element={<TenantSessions />} />
          <Route path="packages" element={<TenantPackages />} />
          <Route path="transactions" element={<TenantTransactions />} />
          <Route path="payment-settings" element={<TenantPayment />} />
          <Route path="business-settings" element={<TenantBusiness />} />
        </Route>

        {/* Platform Owner Dashboard */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tenants" element={<AdminTenants />} />
          <Route path="tenants/new" element={<AddTenant />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="plans/new" element={<CreatePlan />} />
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
