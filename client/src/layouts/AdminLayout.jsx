import { Outlet, NavLink } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div>
      <aside>
        <h2>Platform Admin</h2>

        <nav>
          <NavLink to="/admin/dashboard">Overview</NavLink>
          <NavLink to="/admin/tenants">Tenants</NavLink>
          <NavLink to="/admin/subscriptions">Subscriptions</NavLink>
        </nav>
      </aside>

      <main>
        <Outlet />
      </main>
    </div>
  );
}