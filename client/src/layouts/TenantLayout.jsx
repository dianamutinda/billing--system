
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../api/http.js';

import {
  Wifi,
  LayoutDashboard,
  Users,
  Package,
  ReceiptText,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

import { ThemeProvider } from '../theme/ThemeProvider';
import ThemeToggle from '../components/ui/ThemeToggle';

const navigation = [
  {
    label: 'Dashboard',
    path: '/tenant/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Active Sessions',
    path: '/tenant/sessions',
    icon: Users,
  },
  {
    label: 'Packages',
    path: '/tenant/packages',
    icon: Package,
  },
  {
    label: 'Transactions',
    path: '/tenant/transactions',
    icon: ReceiptText,
  },
  {
    label: 'Payment Settings',
    path: '/tenant/payment-settings',
    icon: CreditCard,
  },
  {
    label: 'Business Settings',
    path: '/tenant/business-settings',
    icon: Settings,
  },
];

function TenantLayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    // The cookie is httpOnly, so only the server can clear it
    await api('/api/tenant/logout', { method: 'POST' });
    navigate('/tenant/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex h-screen w-[260px] shrink-0
          flex-col border-r border-[var(--border)]
          bg-[var(--bg-sidebar)]
          transition-transform duration-300 ease-in-out
          md:sticky md:top-0 md:z-10 md:w-[240px]
          md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >

        {/* Branding */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-6 md:justify-center">
          <div className="flex items-center gap-3 md:flex-col">
            <Wifi size={32} className="text-[var(--primary)]" />

            <h2 className="text-base font-bold">
              Joe's Wi-Fi
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/tenant/dashboard'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar bottom */}
        <div className="border-t border-[var(--border)] p-3">
                    <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <LogOut size={18} />
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="min-w-0 flex-1">

        {/* Topbar */}
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 sm:px-6">

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
            className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] md:hidden"
          >
            <Menu size={22} />
          </button>

          {/* Theme toggle */}
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="w-full min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px] min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function TenantLayout() {
  return (
    <ThemeProvider storageKey="tenant-theme">
      <TenantLayoutContent />
    </ThemeProvider>
  );
}
