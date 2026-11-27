
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Portal from './pages/portal/Portal';
import LoginPage from './pages/auth/LoginPage';
import RequireAuth from './pages/auth/RequireAuth.jsx';

import TenantLayout from './layouts/TenantLayout';
import AdminLayout from './layouts/AdminLayout';

// Tenant pages
import TenantDashboard from './pages/tenant/Dashboard';
import TenantSessions from './pages/tenant/Sessions';
import TenantPackages from './pages/tenant/Packages';
import TenantTransactions from './pages/tenant/Transactions';
import TenantPayment from './pages/tenant/Payment';
import TenantBusiness from './pages/tenant/Business';
import TenantVouchers from './pages/tenant/Vouchers';
import TenantVoucherDetails from './pages/tenant/VoucherDetails';
import TenantVoucherBatchDetails from './pages/tenant/VoucherBatchDetails';

// Admin pages
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
        <Route path="/p/:portalSlug" element={<Portal />} />
        <Route path="/" element={<Portal />} />

        {/* Authentication */}
        <Route path="/tenant/login" element={<LoginPage role="tenant" />} />
        <Route path="/admin/login" element={<LoginPage role="admin" />} />

        {/* Protected Tenant Dashboard */}
        <Route
          path="/tenant"
          element={
            <RequireAuth role="tenant">
              <TenantLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<TenantDashboard />} />
          <Route path="sessions" element={<TenantSessions />} />
          <Route path="packages" element={<TenantPackages />} />
          <Route path="transactions" element={<TenantTransactions />} />

          {/* Vouchers */}
          <Route path="vouchers" element={<TenantVouchers />} />
          <Route
            path="vouchers/:id"
            element={<TenantVoucherDetails />}
          />
          <Route
            path="vouchers/batches/:batchId"
            element={<TenantVoucherBatchDetails />}
          />

          <Route path="payment-settings" element={<TenantPayment />} />
          <Route path="business-settings" element={<TenantBusiness />} />
        </Route>

        {/* Protected Platform Owner Dashboard */}
        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tenants" element={<AdminTenants />} />
          <Route path="tenants/new" element={<AddTenant />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="subscriptions/plans/new" element={<CreatePlan />} />
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
