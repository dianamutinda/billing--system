const router = require('express').Router();
const { withTenant } = require('../db');
const requireTenant = require('../middleware/requireTenant');
const { validateStaticUser } = require('../utils/validateStaticUser');
const { runStaticSync } = require('../services/staticSyncService');

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

router.param('id', (req, res, next, id) => {
  if (!UUID.test(id)) return res.status(404).json({ error: 'User not found' });
  next();
});

router.use(requireTenant);

router.get('/', async (req, res) => {
  try {
    const { rows } = await withTenant(req.tenantId, (client) => client.query(
      `SELECT u.*, host(u.ip_address) AS ip_address, p.label AS package_label
       FROM static_users u JOIN packages p ON p.id = u.package_id
       ORDER BY u.created_at DESC`
    ));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load static users' });
  }
});

const TAKEN = {
  static_users_ip: ['ip_address', 'This IP is already assigned'],
  static_users_mac: ['mac_address', 'This MAC is already registered'],
  static_users_phone: ['phone', 'This phone already has a static user']
};

router.get('/:id', async (req, res) => {
  try {
    const result = await withTenant(req.tenantId, async (client) => {
      const user = await client.query(
        `SELECT *, host(ip_address) AS ip_address
         FROM static_users WHERE id = $1`, [req.params.id]);
      if (!user.rows[0]) return null;
      const reminders = await client.query(
        `SELECT kind, channel, status, error, created_at FROM reminder_log
         WHERE static_user_id = $1 ORDER BY created_at DESC LIMIT 20`,
        [req.params.id]);
      return { ...user.rows[0], reminders: reminders.rows };
    });
    if (!result) return res.status(404).json({ error: 'User not found' });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load the user' });
  }
});

router.put('/:id', async (req, res) => {
  const { valid, errors, data } = validateStaticUser(req.body);
  if (!valid) return res.status(400).json({ errors });

  try {
    const result = await withTenant(req.tenantId, async (client) => {
      const pkg = await client.query(
        `SELECT 1 FROM packages WHERE id = $1 AND service_type = 'static'`,
        [data.package_id]);
      if (!pkg.rows[0]) return 'bad_package';

      const columns = Object.keys(data);
      const sets = columns.map((c, i) => `${c} = $${i + 2}`).join(', ');
      const { rows } = await client.query(
        `UPDATE static_users SET ${sets}, sync_status = 'pending_sync'
         WHERE id = $1 AND status <> 'cancelled' RETURNING id`,
        [req.params.id, ...columns.map((c) => data[c])]);
      return rows[0];
    });
    if (result === 'bad_package') {
      return res.status(400).json({ errors: { package_id: 'Choose a static package' } });
    }
    if (!result) return res.status(404).json({ error: 'User not found' });
    runStaticSync();
    res.json({ ok: true });
  } catch (err) {
    const taken = err.code === '23505' && TAKEN[err.constraint];
    if (taken) return res.status(409).json({ errors: { [taken[0]]: taken[1] } });
    console.error(err);
    res.status(500).json({ error: 'Could not save changes' });
  }
});


router.post('/', async (req, res) => {
  const { valid, errors, data } = validateStaticUser(req.body);
  if (!valid) return res.status(400).json({ errors });

  try {
    const user = await withTenant(req.tenantId, async (client) => {
      const pkg = await client.query(
        `SELECT 1 FROM packages
         WHERE id = $1 AND service_type = 'static' AND active`,
        [data.package_id]
      );
      if (!pkg.rows[0]) return null;

      const columns = Object.keys(data); // fixed names from the validator
      const names = ['tenant_id', ...columns].join(', ');
      const values = [req.tenantId, ...columns.map((c) => data[c])];
      const marks = values.map((_, i) => `$${i + 1}`).join(', ');
      const { rows } = await client.query(
        `INSERT INTO static_users (${names}) VALUES (${marks}) RETURNING *`,
        values
      );
      return rows[0];
    });
    if (!user) {
      return res.status(400).json({ errors: { package_id: 'Choose a static package' } });
    }
    runStaticSync(); // no await: reply straight away
    res.status(201).json(user);
  } catch (err) {
    const taken = err.code === '23505' && TAKEN[err.constraint];
    if (taken) return res.status(409).json({ errors: { [taken[0]]: taken[1] } });
    console.error(err);
    res.status(500).json({ error: 'Could not add static user' });
  }
});
const ACTIONS = {
  suspend: 'manually_suspended = true',
  reactivate: 'manually_suspended = false',
  cancel: "status = 'cancelled'",
  sync: 'last_sync_error = NULL'
};

for (const [action, change] of Object.entries(ACTIONS)) {
  router.post(`/:id/${action}`, async (req, res) => {
    try {
      const { rows } = await withTenant(req.tenantId, (client) => client.query(
        `UPDATE static_users SET ${change}, sync_status = 'pending_sync'
         WHERE id = $1 AND status <> 'cancelled' RETURNING id`,
        [req.params.id]));
      if (!rows[0]) return res.status(404).json({ error: 'User not found' });
      runStaticSync(); // no await: reply straight away
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Action failed' });
    }
  });
}

module.exports = router;