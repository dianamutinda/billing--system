const express = require('express');
const crypto = require('crypto');
const rl = require('express-rate-limit');
const rateLimit = rl.rateLimit || rl;
const { pool } = require('../db');
const requireTenant = require('../middleware/requireTenant');
const requireActiveTenant = require('../middleware/requireActiveTenant');
const { requireActivePaidTenant } = require('../middleware/requireActiveTenant');
const { activateVoucher, revoke } = require('../services/networkService');

const router = express.Router();

// Unambiguous uppercase charset (skips 0/O and 1/I/L for easy typing on captive portals)
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;
const CODE_RE = /^[A-Z0-9-]{4,24}$/;

const redeemIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many voucher redemption attempts. Try again later.' },
});

const redeemSlugCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const slug = String(req.params?.portalSlug || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim().toUpperCase();
    return `voucher-redeem:${slug}:${code}`;
  },
  message: { error: 'Too many attempts for this voucher code. Try again later.' },
});

function generateVoucherCode(length = 8, prefix = '') {
  const cleanPrefix = String(prefix || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 12);

  const randomLen = Math.max(4, Math.min(32 - cleanPrefix.length, length));
  const bytes = crypto.randomBytes(randomLen);
  let code = '';
  for (let i = 0; i < randomLen; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `${cleanPrefix}${code}`;
}

async function cleanupOnRouter(voucher) {
  const result = await revoke({
    tenant_id: voucher.tenant_id,
    router_id: voucher.router_id,
    username: voucher.code,
  });
  const ok = result?.success === true;
  const error = ok ? null : result?.error || 'Router cleanup pending';

  await pool.query(
    `UPDATE public.vouchers
     SET revoke_attempts = revoke_attempts + 1,
         router_revoked_at = CASE WHEN $3::boolean THEN NOW() ELSE router_revoked_at END,
         revoke_error = $4
     WHERE id = $1 AND tenant_id = $2`,
    [voucher.id, voucher.tenant_id, ok, error]
  );
  return { ok, error };
}

async function createVoucherBatchHandler(req, res) {
  try {
    const body = req.body || {};
    const count = Number(body.count);
    const prefix = typeof body.prefix === 'string' ? body.prefix.trim().toUpperCase() : '';
    const requestedLen =
      body.codeLength !== undefined && body.codeLength !== null && body.codeLength !== ''
        ? Number(body.codeLength)
        : 8;
    const routerId =
      typeof body.routerId === 'string' && body.routerId.trim() ? body.routerId.trim() : null;

    if (!Number.isInteger(count) || count < 1 || count > 200) {
      return res.status(400).json({ error: 'count must be an integer between 1 and 200' });
    }
    if (!Number.isInteger(requestedLen) || requestedLen < 4 || requestedLen > 32) {
      return res.status(400).json({ error: 'codeLength must be an integer between 4 and 32' });
    }
    if (routerId && !UUID_RE.test(routerId)) {
      return res.status(400).json({ error: 'Invalid routerId format' });
    }

    let durationMinutes = Number(body.durationMinutes);
    let priceKes =
      body.priceKes === undefined || body.priceKes === null || body.priceKes === ''
        ? 0
        : Number(body.priceKes);
    let label = typeof body.label === 'string' ? body.label.trim().slice(0, 80) : '';

    // Optional package lookup if packageId is passed instead of raw duration/price
    if (body.packageId) {
      const pkgRes = await pool.query(
        `SELECT *
         FROM public.packages
         WHERE id = $1 AND tenant_id = $2
         LIMIT 1`,
        [body.packageId, req.tenantId]
      );
      const pkg = pkgRes.rows[0];
      if (!pkg) {
        return res.status(404).json({ error: 'Selected package not found' });
      }

      const pkgLabel = pkg.label ?? pkg.name ?? pkg.title ?? pkg.package_name;
      if (!label && pkgLabel) {
        label = String(pkgLabel).trim().slice(0, 80);
      }

      if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
        const rawDuration = pkg.duration_minutes ?? pkg.durationMinutes;
        if (rawDuration !== undefined && rawDuration !== null) {
          durationMinutes = Number(rawDuration);
        }
      }

      if (body.priceKes === undefined || body.priceKes === null || body.priceKes === '') {
        const rawPrice = pkg.price_kes ?? pkg.price ?? pkg.amount ?? pkg.price_ksh;
        if (rawPrice !== undefined && rawPrice !== null) {
          priceKes = Number(rawPrice);
        }
      }
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 525600) {
      return res
        .status(400)
        .json({ error: 'durationMinutes must be an integer between 1 and 525600' });
    }
    if (!Number.isInteger(priceKes) || priceKes < 0 || priceKes > 1000000) {
      return res.status(400).json({ error: 'priceKes must be a non-negative integer' });
    }

    const batchId = crypto.randomUUID();
    const generated = new Set();
    while (generated.size < count) {
      generated.add(generateVoucherCode(requestedLen, prefix));
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const inserted = [];
      for (const code of generated) {
        let row = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          const candidate =
            attempt === 0 ? code : generateVoucherCode(requestedLen, prefix);
          try {
            const { rows } = await client.query(
              `INSERT INTO public.vouchers (
                 tenant_id,
                 router_id,
                 batch_id,
                 code,
                 label,
                 duration_minutes,
                 price_kes,
                 status
               )
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'unused')
               RETURNING id, tenant_id, router_id, batch_id, code, label, duration_minutes, price_kes, status, created_at`,
              [req.tenantId, routerId, batchId, candidate, label, durationMinutes, priceKes]
            );
            row = rows[0];
            break;
          } catch (err) {
            if (err.code === '23505') {
              continue;
            }
            throw err;
          }
        }

        if (!row) {
          throw new Error('Failed to generate unique voucher codes');
        }
        inserted.push(row);
      }

      await client.query('COMMIT');
      return res.status(201).json({
        ok: true,
        batchId,
        count: inserted.length,
        vouchers: inserted,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('POST /vouchers/batch error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

// POST /api/vouchers/batch & POST /api/vouchers/batches
router.post('/batch', requireTenant, requireActivePaidTenant, createVoucherBatchHandler);
router.post('/batches', requireTenant, requireActivePaidTenant, createVoucherBatchHandler);

// GET /api/vouchers — list tenant vouchers with optional status, batchId, and search
router.get('/', requireTenant, requireActiveTenant, async (req, res) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const batchId =
      typeof req.query.batchId === 'string' && req.query.batchId.trim()
        ? req.query.batchId.trim()
        : '';
    const search =
      typeof req.query.q === 'string'
        ? req.query.q.trim().toUpperCase()
        : typeof req.query.search === 'string'
          ? req.query.search.trim().toUpperCase()
          : '';
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);

    const conditions = ['tenant_id = $1'];
    const params = [req.tenantId];
    let idx = 2;

    if (status) {
      if (!['unused', 'active', 'expired', 'revoked'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status filter' });
      }
      conditions.push(`status = $${idx++}`);
      params.push(status);
    }

    if (batchId) {
      if (!UUID_RE.test(batchId)) {
        return res.status(400).json({ error: 'Invalid batchId filter' });
      }
      conditions.push(`batch_id = $${idx++}`);
      params.push(batchId);
    }

    if (search) {
      conditions.push(`code ILIKE $${idx++}`);
      params.push(`%${search}%`);
    }

    params.push(limit);

    const { rows } = await pool.query(
      `SELECT id,
              router_id,
              batch_id,
              code,
              label,
              duration_minutes,
              price_kes,
              status,
              redeemed_at,
              expires_at,
              revoked_at,
              created_at,
              router_revoked_at,
              revoke_attempts,
              revoke_error
       FROM public.vouchers
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${idx}`,
      params
    );

    return res.json({ ok: true, vouchers: rows });
  } catch (err) {
    console.error('GET /vouchers error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/vouchers/batches/:batchId — fetch batch metadata and all vouchers in that batch
router.get('/batches/:batchId', requireTenant, requireActiveTenant, async (req, res) => {
  try {
    const batchId = String(req.params.batchId || '').trim();
    if (!UUID_RE.test(batchId)) {
      return res.status(400).json({ error: 'Invalid batch ID' });
    }

    const { rows } = await pool.query(
      `SELECT id,
              router_id,
              batch_id,
              code,
              label,
              duration_minutes,
              price_kes,
              status,
              redeemed_at,
              expires_at,
              revoked_at,
              created_at
       FROM public.vouchers
       WHERE tenant_id = $1
         AND batch_id = $2
       ORDER BY created_at ASC, code ASC`,
      [req.tenantId, batchId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Voucher batch not found' });
    }

    const first = rows[0];
    return res.json({
      ok: true,
      batch: {
        id: batchId,
        package_name: first.label || 'Wi-Fi package',
        package_price: first.price_kes,
        duration_minutes: first.duration_minutes,
        count: rows.length,
        router_id: first.router_id,
        created_at: first.created_at,
      },
      vouchers: rows,
    });
  } catch (err) {
    console.error('GET /vouchers/batches/:batchId error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/vouchers/:id — fetch single voucher details
router.get('/:id', requireTenant, requireActiveTenant, async (req, res) => {
  try {
    const voucherId = String(req.params.id || '').trim();
    if (!UUID_RE.test(voucherId)) {
      return res.status(400).json({ error: 'Invalid voucher ID' });
    }

    const { rows } = await pool.query(
      `SELECT id,
              tenant_id,
              router_id,
              batch_id,
              code,
              label,
              duration_minutes,
              price_kes,
              status,
              redeemed_at,
              expires_at,
              revoked_at,
              router_revoked_at,
              revoke_attempts,
              revoke_error,
              created_at
       FROM public.vouchers
       WHERE id = $1
         AND tenant_id = $2
       LIMIT 1`,
      [voucherId, req.tenantId]
    );

    const voucher = rows[0];
    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    return res.json({ ok: true, voucher });
  } catch (err) {
    console.error('GET /vouchers/:id error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/vouchers/:id/revoke — revoke an unused voucher and remove any stale MikroTik user
router.post('/:id/revoke', requireTenant, requireActiveTenant, async (req, res) => {
  try {
    const voucherId = String(req.params.id || '').trim();
    if (!UUID_RE.test(voucherId)) {
      return res.status(400).json({ error: 'Invalid voucher ID' });
    }

    const { rows } = await pool.query(
      `UPDATE public.vouchers
       SET status = 'revoked',
           revoked_at = COALESCE(revoked_at, NOW())
       WHERE id = $1
         AND tenant_id = $2
         AND status = 'unused'
       RETURNING id,
                 tenant_id,
                 router_id,
                 batch_id,
                 code,
                 label,
                 duration_minutes,
                 price_kes,
                 status,
                 redeemed_at,
                 expires_at,
                 revoked_at,
                 router_revoked_at,
                 revoke_attempts,
                 revoke_error,
                 created_at`,
      [voucherId, req.tenantId]
    );

    const voucher = rows[0];
    if (!voucher) {
      return res.status(404).json({
        error: 'Unused voucher not found or already redeemed/revoked',
      });
    }

    const { ok: routerRevoked, error: routerError } = await cleanupOnRouter(voucher);

    return res.json({
      ok: true,
      voucher,
      routerRevoked,
      ...(routerRevoked ? {} : { warning: routerError }),
    });
  } catch (err) {
    console.error('POST /vouchers/:id/revoke error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/vouchers/:id/retry-revocation — re-attempt router cleanup for a revoked or expired voucher
router.post('/:id/retry-revocation', requireTenant, requireActiveTenant, async (req, res) => {
  try {
    const voucherId = String(req.params.id || '').trim();
    if (!UUID_RE.test(voucherId)) {
      return res.status(400).json({ error: 'Invalid voucher ID' });
    }

    const { rows } = await pool.query(
      `SELECT id,
              tenant_id,
              router_id,
              batch_id,
              code,
              label,
              duration_minutes,
              price_kes,
              status,
              redeemed_at,
              expires_at,
              revoked_at,
              router_revoked_at,
              revoke_attempts,
              revoke_error,
              created_at
       FROM public.vouchers
       WHERE id = $1
         AND tenant_id = $2
       LIMIT 1`,
      [voucherId, req.tenantId]
    );

    const voucher = rows[0];
    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    if (!['revoked', 'expired'].includes(voucher.status)) {
      return res.status(409).json({ error: 'Voucher is not revoked or expired' });
    }

    const { ok: routerRevoked, error: routerError } = await cleanupOnRouter(voucher);

    return res.json({
      ok: true,
      voucher,
      routerRevoked,
      ...(routerRevoked ? {} : { warning: routerError }),
    });
  } catch (err) {
    console.error('POST /vouchers/:id/retry-revocation error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/vouchers/portal/:portalSlug/redeem — redeem voucher code on MikroTik
router.post(
  '/portal/:portalSlug/redeem',
  redeemIpLimiter,
  redeemSlugCodeLimiter,
  async (req, res) => {
    const client = await pool.connect();
    let inTransaction = false;

    try {
      const portalSlug = String(req.params.portalSlug || '').trim().toLowerCase();
      const rawCode = String(req.body?.code || '').trim().toUpperCase();
      const macAddress =
        typeof req.body?.macAddress === 'string' && req.body.macAddress.trim()
          ? req.body.macAddress.trim()
          : null;

      if (!SLUG_RE.test(portalSlug)) {
        return res.status(400).json({ error: 'Invalid portal slug' });
      }
      if (!CODE_RE.test(rawCode)) {
        return res.status(400).json({ error: 'Invalid voucher code format' });
      }

      await client.query('BEGIN');
      inTransaction = true;

      const tenantRes = await client.query(
        `SELECT id, status, plan_expires_at
         FROM public.tenants
         WHERE lower(portal_slug::text) = $1
         LIMIT 1`,
        [portalSlug]
      );
      const tenant = tenantRes.rows[0];
      if (!tenant || tenant.status === 'suspended') {
        await client.query('ROLLBACK');
        inTransaction = false;
        return res.status(404).json({ error: 'Portal not available' });
      }

      if (
        tenant.plan_expires_at &&
        new Date(tenant.plan_expires_at).getTime() <= Date.now()
      ) {
        await client.query('ROLLBACK');
        inTransaction = false;
        return res.status(403).json({ error: 'Hotspot provider subscription has expired' });
      }

      const voucherRes = await client.query(
        `SELECT id,
                tenant_id,
                router_id,
                code,
                duration_minutes,
                status
         FROM public.vouchers
         WHERE tenant_id = $1
           AND upper(code) = $2
         FOR UPDATE
         LIMIT 1`,
        [tenant.id, rawCode]
      );

      const voucher = voucherRes.rows[0];
      if (!voucher) {
        await client.query('ROLLBACK');
        inTransaction = false;
        return res.status(404).json({ error: 'Voucher code not found' });
      }

      if (voucher.status !== 'unused') {
        await client.query('ROLLBACK');
        inTransaction = false;
        return res.status(409).json({
          error: `Voucher cannot be redeemed (current status: ${voucher.status})`,
        });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + voucher.duration_minutes * 60 * 1000);

      const mikrotikResult = await activateVoucher(
        {
          ...voucher,
          expires_at: expiresAt.toISOString(),
        },
        { mac_address: macAddress }
      );

      if (!mikrotikResult.success) {
        await client.query('ROLLBACK');
        inTransaction = false;
        return res.status(502).json({
          error: 'Could not activate voucher on router. Please try again.',
        });
      }

      const updatedRes = await client.query(
        `UPDATE public.vouchers
         SET status = 'active',
             redeemed_at = $2,
             expires_at = $3
         WHERE id = $1
         RETURNING id, code, status, duration_minutes, redeemed_at, expires_at`,
        [voucher.id, now.toISOString(), expiresAt.toISOString()]
      );

      await client.query('COMMIT');
      inTransaction = false;

      return res.status(200).json({
        ok: true,
        username: voucher.code,
        password: voucher.code,
        voucher: updatedRes.rows[0],
      });
    } catch (err) {
      if (inTransaction) {
        try {
          await client.query('ROLLBACK');
        } catch (_) {
          // Ignore rollback failure
        }
      }
      console.error('POST /vouchers/portal/:portalSlug/redeem error:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;