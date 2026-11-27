const express = require('express');
const { withTenant } = require('../db');
const requireTenant = require('../middleware/requireTenant');

const router = express.Router();
router.use(requireTenant);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validLabel(v) {
  return typeof v === 'string' && v.trim().length >= 1 && v.trim().length <= 60;
}
function validAmount(v) {
  return Number.isInteger(v) && v >= 1 && v <= 150000;
}
function validDuration(v) {
  return Number.isInteger(v) && v >= 1 && v <= 527040; // up to 366 days
}

router.get('/', async (req, res) => {
  try {
    const packages = await withTenant(req.tenantId, async (client) => {
      const { rows } = await client.query(
        `SELECT id, label, amount, duration_minutes, active
         FROM packages
         WHERE tenant_id = $1
         ORDER BY duration_minutes ASC, label ASC`,
        [req.tenantId]
      );
      return rows;
    });
    return res.json(packages);
  } catch (err) {
    console.error('tenant packages list failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { label, amount, durationMinutes } = req.body || {};

    if (!validLabel(label)) {
      return res.status(400).json({ error: 'Label must be 1 to 60 characters' });
    }
    if (!validAmount(amount)) {
      return res.status(400).json({ error: 'Amount must be a whole number from 1 to 150000' });
    }
    if (!validDuration(durationMinutes)) {
      return res.status(400).json({ error: 'Duration must be 1 to 527040 minutes' });
    }

    const created = await withTenant(req.tenantId, async (client) => {
      const { rows } = await client.query(
        `INSERT INTO packages (label, amount, duration_minutes, active, tenant_id)
         VALUES ($1, $2, $3, true, $4)
         RETURNING id, label, amount, duration_minutes, active`,
        [label.trim(), amount, durationMinutes, req.tenantId]
      );
      return rows[0];
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error('tenant package create failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const { label, amount, durationMinutes, active } = req.body || {};

    if (label !== undefined && !validLabel(label)) {
      return res.status(400).json({ error: 'Label must be 1 to 60 characters' });
    }
    if (amount !== undefined && !validAmount(amount)) {
      return res.status(400).json({ error: 'Amount must be a whole number from 1 to 150000' });
    }
    if (durationMinutes !== undefined && !validDuration(durationMinutes)) {
      return res.status(400).json({ error: 'Duration must be 1 to 527040 minutes' });
    }
    if (active !== undefined && typeof active !== 'boolean') {
      return res.status(400).json({ error: 'Active must be true or false' });
    }
    if ([label, amount, durationMinutes, active].every((v) => v === undefined)) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const updated = await withTenant(req.tenantId, async (client) => {
      const { rows } = await client.query(
        `UPDATE packages
         SET label = COALESCE($1, label),
             amount = COALESCE($2, amount),
             duration_minutes = COALESCE($3, duration_minutes),
             active = COALESCE($4, active)
         WHERE id = $5 AND tenant_id = $6
         RETURNING id, label, amount, duration_minutes, active`,
        [
          label === undefined ? null : label.trim(),
          amount ?? null,
          durationMinutes ?? null,
          active ?? null,
          req.params.id,
          req.tenantId,
        ]
      );
      return rows[0];
    });

    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json(updated);
  } catch (err) {
    console.error('tenant package update failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;