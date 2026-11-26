const express = require('express');
const { pool } = require('../db');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function statusOf(planId, expiresAt) {
  if (!planId) return 'No plan';
  const left = new Date(expiresAt).getTime() - Date.now();
  if (left <= 0) return 'Overdue';
  if (left <= SEVEN_DAYS) return 'Expiring soon';
  return 'Active';
}

// Every tenant with their plan, expiry and derived status, plus summary numbers
router.get('/', async (req, res) => {
  try {
    const [tenants, revenue] = await Promise.all([
      pool.query(
        `SELECT t.id, t.business_name, t.email, t.plan_expires_at,
                p.id AS plan_id, p.name AS plan_name, p.price_kes, p.billing_cycle
         FROM tenants t
         LEFT JOIN plans p ON p.id = t.plan_id
         ORDER BY t.business_name`
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount_kes), 0)::int AS total
         FROM subscription_payments
         WHERE (created_at AT TIME ZONE 'Africa/Nairobi') >=
               date_trunc('month', now() AT TIME ZONE 'Africa/Nairobi')`
      ),
    ]);

    const subscriptions = tenants.rows.map((t) => ({
      tenantId: t.id,
      tenant: t.business_name,
      email: t.email,
      planId: t.plan_id,
      plan: t.plan_name,
      amount: t.price_kes,
      billingCycle: t.billing_cycle,
      expiresAt: t.plan_expires_at,
      status: statusOf(t.plan_id, t.plan_expires_at),
    }));

    const count = (s) => subscriptions.filter((x) => x.status === s).length;

    res.json({
      summary: {
        revenueThisMonth: revenue.rows[0].total,
        active: count('Active') + count('Expiring soon'),
        expiringSoon: count('Expiring soon'),
        overdue: count('Overdue'),
      },
      subscriptions,
    });
  } catch (err) {
    console.error('Admin subscriptions failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Record a payment you received from a tenant and extend their plan
router.post('/:tenantId/payments', async (req, res) => {
  const { tenantId } = req.params;
  if (!UUID_RE.test(tenantId)) {
    return res.status(400).json({ error: 'Invalid tenant id' });
  }

  const planId = String(req.body.planId || '');
  if (!UUID_RE.test(planId)) {
    return res.status(400).json({ error: 'Choose a plan' });
  }

  const reference = String(req.body.reference ?? '').trim();
  if (reference.length > 100) {
    return res.status(400).json({ error: 'Reference is too long' });
  }

  // Amount is optional: it defaults to the plan's price
  let amount = null;
  if (req.body.amount !== undefined && req.body.amount !== null && req.body.amount !== '') {
    amount = Number(req.body.amount);
    if (!Number.isInteger(amount) || amount < 0 || amount > 10000000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the tenant row so two payments can't extend the same period twice
    const t = await client.query(
      'SELECT id, plan_id, plan_expires_at FROM tenants WHERE id = $1 FOR UPDATE',
      [tenantId]
    );
    if (!t.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const p = await client.query(
      'SELECT id, price_kes, billing_cycle, is_active FROM plans WHERE id = $1',
      [planId]
    );
    const plan = p.rows[0];
    if (!plan || !plan.is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'That plan is not available' });
    }

    const tenant = t.rows[0];
    const interval = plan.billing_cycle === 'annually' ? '1 year' : '1 month';

    // Same plan and still running: continue from the current expiry. Otherwise start now.
    const payment = await client.query(
      `INSERT INTO subscription_payments
         (tenant_id, plan_id, amount_kes, method, reference, period_start, period_end)
       SELECT $1::uuid, $2::uuid, $3::int, 'manual', $4, s.start, s.start + $5::interval
       FROM (
         SELECT CASE
                  WHEN $6::uuid = $2::uuid AND $7::timestamptz > now()
                  THEN $7::timestamptz
                  ELSE now()
                END AS start
       ) s
       RETURNING period_end`,
      [
        tenantId,
        planId,
        amount === null ? plan.price_kes : amount,
        reference || null,
        interval,
        tenant.plan_id,
        tenant.plan_expires_at,
      ]
    );

    await client.query(
      'UPDATE tenants SET plan_id = $1, plan_expires_at = $2 WHERE id = $3',
      [planId, payment.rows[0].period_end, tenantId]
    );

    await client.query('COMMIT');
    res.status(201).json({ ok: true, expiresAt: payment.rows[0].period_end });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Admin record payment failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  } finally {
    client.release();
  }
});

// Remove a tenant's plan. Their payment history is kept.
router.post('/:tenantId/cancel', async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.tenantId)) {
      return res.status(400).json({ error: 'Invalid tenant id' });
    }
    const { rows } = await pool.query(
      `UPDATE tenants SET plan_id = NULL, plan_expires_at = NULL
       WHERE id = $1 RETURNING id`,
      [req.params.tenantId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin cancel subscription failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;