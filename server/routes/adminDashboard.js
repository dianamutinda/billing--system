const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [tenantCounts, subs, months, plans, recentTenants, recentPayments] =
      await Promise.all([
        // 1. Tenant totals
        pool.query(
          `SELECT count(*)::int AS total,
                  count(*) FILTER (WHERE must_change_password)::int AS pending,
                  count(*) FILTER (WHERE router_host IS NOT NULL AND router_host <> '')::int AS routers,
                  count(*) FILTER (WHERE daraja_shortcode IS NOT NULL AND daraja_shortcode <> '')::int AS payments
           FROM tenants`
        ),

        // 2. Subscription counts, using the same rules as the Subscriptions page
        pool.query(
          `SELECT
             count(*) FILTER (WHERE plan_id IS NOT NULL AND plan_expires_at > now())::int AS active,
             count(*) FILTER (WHERE plan_id IS NOT NULL AND plan_expires_at > now()
                              AND plan_expires_at <= now() + interval '7 days')::int AS expiring,
             count(*) FILTER (WHERE plan_id IS NOT NULL AND plan_expires_at <= now())::int AS overdue,
             count(*) FILTER (WHERE plan_id IS NULL)::int AS no_plan
           FROM tenants`
        ),

        // 3. Last 6 months: new tenants, running total, and subscription revenue
        pool.query(
          `WITH months AS (
             SELECT generate_series(
               date_trunc('month', now() AT TIME ZONE 'Africa/Nairobi') - interval '5 months',
               date_trunc('month', now() AT TIME ZONE 'Africa/Nairobi'),
               interval '1 month'
             ) AS m
           )
           SELECT to_char(m, 'Mon') AS label,
                  (SELECT count(*) FROM tenants t
                   WHERE date_trunc('month', t.created_at AT TIME ZONE 'Africa/Nairobi') = m)::int AS new_tenants,
                  (SELECT count(*) FROM tenants t
                   WHERE (t.created_at AT TIME ZONE 'Africa/Nairobi') < m + interval '1 month')::int AS total_tenants,
                  (SELECT COALESCE(SUM(sp.amount_kes), 0) FROM subscription_payments sp
                   WHERE date_trunc('month', sp.created_at AT TIME ZONE 'Africa/Nairobi') = m)::int AS revenue
           FROM months
           ORDER BY m`
        ),

        // 4. Plans with how many tenants are currently subscribed
        pool.query(
          `SELECT p.id, p.name, p.price_kes, p.billing_cycle, p.is_active,
                  count(t.id) FILTER (WHERE t.plan_expires_at > now())::int AS subscribers
           FROM plans p
           LEFT JOIN tenants t ON t.plan_id = p.id
           GROUP BY p.id
           ORDER BY p.price_kes ASC, p.created_at ASC`
        ),

        // 5. Newest tenants
        pool.query(
          `SELECT id, business_name, email, created_at, must_change_password
           FROM tenants
           ORDER BY created_at DESC
           LIMIT 5`
        ),

        // 6. Latest subscription payments you recorded
        pool.query(
          `SELECT sp.id, sp.amount_kes, sp.created_at, sp.reference,
                  ten.business_name, pl.name AS plan_name
           FROM subscription_payments sp
           JOIN tenants ten ON ten.id = sp.tenant_id
           JOIN plans pl ON pl.id = sp.plan_id
           ORDER BY sp.created_at DESC
           LIMIT 5`
        ),
      ]);

    const c = tenantCounts.rows[0];
    const s = subs.rows[0];
    const monthRows = months.rows;

    res.json({
      totalTenants: c.total,
      pendingTenants: c.pending,
      activeTenants: c.total - c.pending,
      routersConfigured: c.routers,
      paymentsConfigured: c.payments,
      subscriptions: {
        active: s.active,
        expiringSoon: s.expiring,
        overdue: s.overdue,
        noPlan: s.no_plan,
        // The last month in the series is the current month
        revenueThisMonth: monthRows[monthRows.length - 1].revenue,
      },
      revenueTrend: monthRows.map((r) => ({ label: r.label, revenue: r.revenue })),
      tenantGrowth: monthRows.map((r) => ({
        label: r.label,
        newTenants: r.new_tenants,
        totalTenants: r.total_tenants,
      })),
      plans: plans.rows.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price_kes,
        billingCycle: p.billing_cycle,
        isActive: p.is_active,
        subscribers: p.subscribers,
      })),
      recentTenants: recentTenants.rows.map((t) => ({
        id: t.id,
        name: t.business_name,
        email: t.email,
        createdAt: t.created_at,
        status: t.must_change_password ? 'Pending' : 'Active',
      })),
      recentSubscriptionPayments: recentPayments.rows.map((p) => ({
        id: p.id,
        tenant: p.business_name,
        plan: p.plan_name,
        amount: p.amount_kes,
        reference: p.reference,
        createdAt: p.created_at,
      })),
    });
  } catch (err) {
    console.error('Admin dashboard failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;