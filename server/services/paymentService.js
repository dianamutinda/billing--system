
async function processStkCallback(cb) {
  const { CheckoutRequestID, ResultCode, ResultDesc } = cb;
  const items = (cb.CallbackMetadata && cb.CallbackMetadata.Item) || [];
  const meta = Object.fromEntries(items.map((i) => [i.Name, i.Value]));
  const receipt = meta.MpesaReceiptNumber ? String(meta.MpesaReceiptNumber) : null;
  const paidAmount = Number(meta.Amount);

  const client = await pool.connect();
  let broken = false;

  try {
    await client.query('BEGIN');

    // Lock this transaction row so two simultaneous retries can't both process it
    const found = await client.query(
      'SELECT * FROM transactions WHERE checkout_request_id = $1 FOR UPDATE',
      [CheckoutRequestID]
    );
    const tx = found.rows[0];

    if (!tx || tx.status !== 'pending') {
      await client.query('COMMIT');
      return null; // unknown or already handled: nothing to do
    }

    if (ResultCode !== 0) {
      await client.query(
        `UPDATE transactions SET status = 'failed', result_desc = $2 WHERE checkout_request_id = $1`,
        [CheckoutRequestID, ResultDesc]
      );
      await client.query('COMMIT');
      return { status: 'failed' };
    }

    const pk = await client.query(
      'SELECT * FROM packages WHERE id = $1 AND tenant_id = $2',
      [tx.package_id, tx.tenant_id]
    );
    const pkg = pk.rows[0];

    if (!pkg || paidAmount !== Number(pkg.amount)) {
      const reason = !pkg
        ? 'package missing'
        : `amount mismatch: paid ${paidAmount}, price ${pkg.amount}`;

      await client.query(
        `UPDATE transactions SET status = 'review', result_desc = $2, mpesa_receipt = $3
         WHERE checkout_request_id = $1`,
        [CheckoutRequestID, reason, receipt]
      );

      await client.query('COMMIT');
      console.error(`Payment needs review (tenant ${tx.tenant_id}): ${reason}`);
      return { status: 'review' };
    }

    await client.query(
      `UPDATE transactions SET status = 'paid', result_desc = $2, mpesa_receipt = $3
       WHERE checkout_request_id = $1`,
      [CheckoutRequestID, ResultDesc, receipt]
    );

    const expiresAt = new Date(Date.now() + pkg.duration_minutes * 60 * 1000);

    const sess = await client.query(
      `INSERT INTO sessions (phone_number, package_id, package_name, expires_at, token, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tx.phone, pkg.id, pkg.label, expiresAt, tx.token, tx.tenant_id]
    );

    await client.query('COMMIT');
    return { status: 'paid', session: sess.rows[0] };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      broken = true; // the connection itself died, so the rollback failed too
    }

    throw err; // always surface the original error
  } finally {
    client.release(broken); // true tells the pool to destroy a dead client
  }
}
