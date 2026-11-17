import { Outlet, NavLink } from 'react-router-dom';

export default function TenantLayout() {
  return (
    <div>
      <aside>
        <h2>Tenant Dashboard</h2>

        <nav>
          <NavLink to="/tenant/dashboard">Dashboard</NavLink>
          <NavLink to="/tenant/sessions">Sessions</NavLink>
          <NavLink to="/tenant/packages">Packages</NavLink>
          <NavLink to="/tenant/transactions">Transactions</NavLink>
        </nav>
      </aside>

      <main>
        <Outlet />
      </main>
    </div>
  );
}