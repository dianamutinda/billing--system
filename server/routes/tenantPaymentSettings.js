const express = require('express');
const { pool } = require('../db');
const requireTenant = require('../middleware/requireTenant');
const { encrypt } = require('../services/crypto');

const router = express.Router();
router.use(requireTenant);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT daraja_shortcode, daraja_consumer_key, daraja_env,
              (daraja_consumer_secret_encrypted IS NOT NULL) AS has_consumer_secret,
              (daraja_passkey_encrypted IS NOT NULL) AS has_passkey
       FROM tenants
       WHERE id = $1
       LIMIT 1`,
      [req.tenantId]
    );
    const t = rows[0];
    if (!t) return res.status(404).json({ error: 'Not found' });

    return res.json({
      shortcode: t.daraja_shortcode,
      consumerKey: t.daraja_consumer_key,
      env: t.daraja_env,
      hasConsumerSecret: t.has_consumer_secret,
      hasPasskey: t.has_passkey,
    });
  } catch (err) {
    console.error('payment settings get failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { shortcode, consumerKey, consumerSecret, passkey, env } = req.body || {};

    if (typeof shortcode !== 'string' || !/^\d{5,8}$/.test(shortcode.trim())) {
      return res.status(400).json({ error: 'Invalid shortcode' });
    }
    if (
      typeof consumerKey !== 'string' ||
      consumerKey.trim().length < 1 ||
      consumerKey.trim().length > 256
    ) {
      return res.status(400).json({ error: 'Invalid consumer key' });
    }
    if (env !== 'sandbox' && env !== 'live') {
      return res.status(400).json({ error: 'Invalid environment' });
    }

    // Secrets are optional on update: leave one out to keep the stored value
    for (const [name, value] of [
      ['consumer secret', consumerSecret],
      ['passkey', passkey],
    ]) {
      if (
        value !== undefined &&
        (typeof value !== 'string' || value.trim().length < 1 || value.length > 512)
      ) {
        return res.status(400).json({ error: `Invalid ${name}` });
      }
    }

    // First-time setup needs both secrets, or purchases would still fail
    const { rows } = await pool.query(
      `SELECT (daraja_consumer_secret_encrypted IS NOT NULL) AS has_secret,
              (daraja_passkey_encrypted IS NOT NULL) AS has_passkey
       FROM tenants
       WHERE id = $1
       LIMIT 1`,
      [req.tenantId]
    );
    const current = rows[0];
    if (!current) return res.status(404).json({ error: 'Not found' });

    if (
      (!current.has_secret && consumerSecret === undefined) ||
      (!current.has_passkey && passkey === undefined)
    ) {
      return res.status(400).json({
        error: 'Consumer secret and passkey are required the first time',
      });
    }

    await pool.query(
      `UPDATE tenants
       SET daraja_shortcode = $1,
           daraja_consumer_key = $2,
           daraja_env = $3,
           daraja_consumer_secret_encrypted = COALESCE($4, daraja_consumer_secret_encrypted),
           daraja_passkey_encrypted = COALESCE($5, daraja_passkey_encrypted)
       WHERE id = $6`,
      [
        shortcode.trim(),
        consumerKey.trim(),
        env,
        consumerSecret === undefined ? null : encrypt(consumerSecret.trim()),
        passkey === undefined ? null : encrypt(passkey.trim()),
        req.tenantId,
      ]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('payment settings update failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;