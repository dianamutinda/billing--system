const express = require('express');
const { withTenant } = require('../db');
const requireTenant = require('../middleware/requireTenant');

const router = express.Router();
router.use(requireTenant);

router.get('/', async (req, res) => {
  try {
    const data = await withTenant(req.tenantId, async (client) => {
      // 1. Revenue: only paid transactions, split by Nairobi-local day and month
      const revenue = await client.query(
        `WITH paid AS (
           SELECT COALESCE(t.amount, p.amount) AS amount,
                  t.created_at AT TIME ZONE 'Africa/Nairobi' AS local_ts
           FROM transactions t
           LEFT JOIN packages p ON p.id = t.package_id
           WHERE t.tenant_id = $1 AND t.status = 'paid'
         ),
         bounds AS (
           SELECT date_trunc('day',   now() AT TIME ZONE 'Africa/Nairobi') AS day_start,
                  date_trunc('month', now() AT TIME ZONE 'Africa/Nairobi') AS month_start
         )
         SELECT
           COALESCE(SUM(amount) FILTER (WHERE local_ts >= (SELECT day_start FROM bounds)), 0)   AS revenue_today,
           COALESCE(SUM(amount) FILTER (WHERE local_ts >= (SELECT month_start FROM bounds)), 0) AS revenue_month
         FROM paid`,
        [req.tenantId]
      );

      // 2. Active sessions: same rule as your sessions list
      const active = await client.query(
        `SELECT count(*)::int AS n
         FROM sessions
         WHERE tenant_id = $1 AND status = 'active' AND expires_at > now()`,
        [req.tenantId]
      );

      // 3. Latest 5 paid transactions
      const recent = await client.query(
        `SELECT t.id, t.phone, t.created_at,
                COALESCE(t.package_label, p.label) AS package_label,
                COALESCE(t.amount, p.amount) AS amount
         FROM transactions t
         LEFT JOIN packages p ON p.id = t.package_id
         WHERE t.tenant_id = $1 AND t.status = 'paid'
         ORDER BY t.created_at DESC
         LIMIT 5`,
        [req.tenantId]
      );

      return { revenue: revenue.rows[0], active: active.rows[0], recent: recent.rows };
    });

    res.set('Cache-Control', 'private, max-age=15');
    return res.json({
      revenueToday: Number(data.revenue.revenue_today),
      revenueMonth: Number(data.revenue.revenue_month),
      activeSessions: Number(data.active.n),
      recentTransactions: data.recent.map((r) => ({
        id: r.id,
        phone: r.phone,
        package: r.package_label,
        amount: Number(r.amount),
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error('tenant dashboard failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

const ALLOWED_RANGES = [7, 30, 90];

router.get('/sales', async (req, res) => {
  // 1. Only accept the three ranges the buttons offer; default to 7
  const requested = Number(req.query.days);
  const days = ALLOWED_RANGES.includes(requested) ? requested : 7;

  try {
    const rows = await withTenant(req.tenantId, async (client) => {
      const result = await client.query(
        `WITH days AS (
           SELECT generate_series(
             (now() AT TIME ZONE 'Africa/Nairobi')::date - ($2::int - 1),
             (now() AT TIME ZONE 'Africa/Nairobi')::date,
             interval '1 day'
           )::date AS day
         ),
         paid AS (
           SELECT (t.created_at AT TIME ZONE 'Africa/Nairobi')::date AS day,
                  COALESCE(t.amount, p.amount) AS amount
           FROM transactions t
           LEFT JOIN packages p ON p.id = t.package_id
           WHERE t.tenant_id = $1 AND t.status = 'paid'
         )
         SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
                COALESCE(SUM(paid.amount), 0) AS total
         FROM days d
         LEFT JOIN paid ON paid.day = d.day
         GROUP BY d.day
         ORDER BY d.day`,
        [req.tenantId, days]
      );
      return result.rows;
    });

    res.set('Cache-Control', 'private, max-age=15');
    return res.json(rows.map((r) => ({ day: r.day, total: Number(r.total) })));
  } catch (err) {
    console.error('tenant dashboard sales failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;