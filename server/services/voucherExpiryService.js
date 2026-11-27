const { pool } = require('../db');
const { revokeBatch } = require('../services/networkService');

async function recordRevokeOutcomes(vouchers, outcomes) {
  let revokedCount = 0;
  const failures = [];

  for (const voucher of vouchers) {
    const outcome = outcomes.get(voucher.id) || {
      ok: false,
      error: 'Missing revoke outcome',
    };

    if (outcome.ok) {
      await pool.query(
        `UPDATE public.vouchers
         SET router_revoked_at = COALESCE(router_revoked_at, NOW()),
             revoke_error = NULL,
             revoke_attempts = COALESCE(revoke_attempts, 0) + 1
         WHERE id = $1`,
        [voucher.id]
      );
      revokedCount += 1;
    } else {
      const message = String(outcome.error || 'MikroTik revoke failed').slice(0, 500);
      await pool.query(
        `UPDATE public.vouchers
         SET revoke_error = $2,
             revoke_attempts = COALESCE(revoke_attempts, 0) + 1
         WHERE id = $1`,
        [voucher.id, message]
      );
      failures.push({
        voucherId: voucher.id,
        code: voucher.code,
        error: message,
      });
    }
  }

  return { revokedCount, failures };
}

async function expireDueVouchers(limit = 100) {
  const { rows } = await pool.query(
    `WITH due AS (
       SELECT id
       FROM public.vouchers
       WHERE status = 'active'
         AND expires_at IS NOT NULL
         AND expires_at <= NOW()
       ORDER BY expires_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     UPDATE public.vouchers v
     SET status = 'expired',
         router_revoked_at = NULL
     FROM due
     WHERE v.id = due.id
     RETURNING v.id, v.tenant_id, v.router_id, v.code, v.expires_at`,
    [limit]
  );

  if (!rows.length) {
    return {
      expiredCount: 0,
      revokedCount: 0,
      failures: [],
    };
  }

  const outcomes = await revokeBatch(rows);
  const { revokedCount, failures } = await recordRevokeOutcomes(rows, outcomes);

  return {
    expiredCount: rows.length,
    revokedCount,
    failures,
  };
}

async function retryPendingVoucherRevokes(limit = 100, maxAttempts = 25) {
  const { rows } = await pool.query(
    `SELECT id, tenant_id, router_id, code, expires_at, revoke_attempts
     FROM public.vouchers
     WHERE status IN ('expired', 'revoked')
       AND router_revoked_at IS NULL
       AND COALESCE(revoke_attempts, 0) < $2
     ORDER BY expires_at ASC NULLS LAST
     LIMIT $1`,
    [limit, maxAttempts]
  );

  if (!rows.length) {
    return {
      retriedCount: 0,
      revokedCount: 0,
      failures: [],
    };
  }

  const outcomes = await revokeBatch(rows);
  const { revokedCount, failures } = await recordRevokeOutcomes(rows, outcomes);

  return {
    retriedCount: rows.length,
    revokedCount,
    failures,
  };
}

module.exports = {
  expireDueVouchers,
  retryPendingVoucherRevokes,
};