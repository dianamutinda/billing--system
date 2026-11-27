const { pool } = require('../db'); // adjust to your server Postgres pool export

function formatDbError(err) {
  if (!err || typeof err !== 'object') return err;

  return {
    message: err.message || '',
    code: err.code,
    errno: err.errno,
    address: err.address,
    port: err.port,
    errors: Array.isArray(err.errors)
      ? err.errors.map((subErr) => ({
          message: subErr?.message || '',
          code: subErr?.code,
          errno: subErr?.errno,
          address: subErr?.address,
          port: subErr?.port,
        }))
      : undefined,
  };
}

function createRequireActiveTenant({ requireValidPlan = false } = {}) {
  return async function requireActiveTenant(req, res, next) {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const { rows } = await pool.query(
        `SELECT id, status, suspended_at, plan_id, plan_expires_at
         FROM public.tenants
         WHERE id = $1
         LIMIT 1`,
        [req.tenantId]
      );

      const tenant = rows[0];
      if (!tenant) {
        return res.status(401).json({ error: 'Tenant account not found' });
      }

      if (tenant.status === 'suspended') {
        return res.status(403).json({
          error: 'Tenant account is suspended',
          code: 'TENANT_SUSPENDED',
          suspended_at: tenant.suspended_at,
        });
      }

      const isExpired =
        Boolean(tenant.plan_expires_at) &&
        new Date(tenant.plan_expires_at).getTime() <= Date.now();

      if (requireValidPlan && isExpired) {
        return res.status(402).json({
          error: 'Subscription plan has expired',
          code: 'PLAN_EXPIRED',
          plan_expires_at: tenant.plan_expires_at,
        });
      }

      req.tenant = tenant;
      req.planExpired = isExpired;
      return next();
    } catch (err) {
      console.error('requireActiveTenant error:', formatDbError(err));
      return res.status(500).json({ error: 'Failed to verify tenant status' });
    }
  };
}

// Default: blocks suspended tenants; flags expired plans on req.planExpired
const requireActiveTenant = createRequireActiveTenant({ requireValidPlan: false });
// Strict variant: also blocks expired plans with 402
const requireActivePaidTenant = createRequireActiveTenant({ requireValidPlan: true });

module.exports = requireActiveTenant;
module.exports.createRequireActiveTenant = createRequireActiveTenant;
module.exports.requireActivePaidTenant = requireActivePaidTenant;