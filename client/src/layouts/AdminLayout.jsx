
import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';

import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  CreditCard,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

import { ThemeProvider } from '../theme/ThemeProvider';
import ThemeToggle from '../components/ui/ThemeToggle';

const navigation = [
  {
    label: 'Overview',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Tenants',
    path: '/admin/tenants',
    icon: Building2,
  },
  {
    label: 'Subscriptions',
    path: '/admin/subscriptions',
    icon: CreditCard,
  },
];

function AdminLayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          fixed inset-y-0 left-0 z-40 flex h-screen w-[260px]
          shrink-0 flex-col border-r border-[var(--border)]
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
            <ShieldCheck
              size={34}
              className="text-[var(--primary)]"
            />

            <div className="md:text-center">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Platform Admin
              </h2>

              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Management Console
              </p>
            </div>
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
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Platform Management
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin/dashboard'}
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
            onClick={() => {
              window.location.href = '/';
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="min-w-0 flex-1">

        {/* Topbar */}
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 sm:px-6">

          {/* Mobile menu */}
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

export default function AdminLayout() {
  return (
    <ThemeProvider storageKey="admin-theme">
      <AdminLayoutContent />
    </ThemeProvider>
  );
}
