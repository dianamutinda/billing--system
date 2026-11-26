const express = require('express');
const { pool } = require('../db');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Check and clean the plan fields. Returns { error } or { value }.
function readPlan(body) {
  const name = String(body.name ?? '').trim();
  if (name.length < 2 || name.length > 60) {
    return { error: 'Plan name must be 2 to 60 characters' };
  }

  const description = String(body.description ?? '').trim();
  if (description.length < 1 || description.length > 300) {
    return { error: 'Description is required (up to 300 characters)' };
  }

  const price = Number(body.price);
  if (!Number.isInteger(price) || price < 1 || price > 10000000) {
    return { error: 'Price must be a whole number of KES, at least 1' };
  }

  if (body.billingCycle !== 'monthly' && body.billingCycle !== 'annually') {
    return { error: 'Invalid billing cycle' };
  }

  let routerLimit = null; // null means unlimited
  if (body.routerLimit !== null && body.routerLimit !== undefined) {
    routerLimit = Number(body.routerLimit);
    if (!Number.isInteger(routerLimit) || routerLimit < 1 || routerLimit > 1000) {
      return { error: 'Invalid router limit' };
    }
  }

  if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
    return { error: 'Invalid status' };
  }
  const isActive = body.isActive !== false;

  if (!Array.isArray(body.features) || body.features.length > 20) {
    return { error: 'Features must be a list of up to 20 items' };
  }
  const features = [];
  for (const f of body.features) {
    const text = typeof f === 'string' ? f.trim() : '';
    if (text.length < 1 || text.length > 100) {
      return { error: 'Each feature must be 1 to 100 characters' };
    }
    features.push(text);
  }

  return {
    value: {
      name,
      description,
      price,
      billingCycle: body.billingCycle,
      routerLimit,
      isActive,
      features,
    },
  };
}

const toPlan = (p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  price: p.price_kes,
  billingCycle: p.billing_cycle,
  routerLimit: p.router_limit,
  isActive: p.is_active,
  features: p.features,
  subscribers: p.subscribers ?? 0,
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*,
              (SELECT count(*)::int FROM tenants t
               WHERE t.plan_id = p.id AND t.plan_expires_at > now()) AS subscribers
       FROM plans p
       ORDER BY p.price_kes ASC, p.created_at ASC`
    );
    res.json(rows.map(toPlan));
  } catch (err) {
    console.error('Admin list plans failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { error, value: v } = readPlan(req.body || {});
    if (error) return res.status(400).json({ error });

    const { rows } = await pool.query(
      `INSERT INTO plans
         (name, description, price_kes, billing_cycle, router_limit, is_active, features)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [v.name, v.description, v.price, v.billingCycle, v.routerLimit, v.isActive, v.features]
    );
    res.status(201).json(toPlan(rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A plan with that name already exists' });
    }
    console.error('Admin create plan failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid plan id' });
    }

    const { error, value: v } = readPlan(req.body || {});
    if (error) return res.status(400).json({ error });

    const { rows } = await pool.query(
      `UPDATE plans
       SET name = $1, description = $2, price_kes = $3, billing_cycle = $4,
           router_limit = $5, is_active = $6, features = $7
       WHERE id = $8
       RETURNING *`,
      [v.name, v.description, v.price, v.billingCycle, v.routerLimit,
       v.isActive, v.features, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Plan not found' });

    res.json(toPlan(rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A plan with that name already exists' });
    }
    console.error('Admin update plan failed:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;