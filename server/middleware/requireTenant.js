const jwt = require('jsonwebtoken');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireTenant(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    console.error('JWT_SECRET is missing or too short');
    return res.status(500).json({ error: 'Server authentication misconfigured' });
  }

  const token = req.cookies?.tenant_token;
  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    });

    if (payload.role !== 'tenant') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const tenantId = typeof payload.sub === 'string' ? payload.sub.trim() : '';
    if (!UUID_RE.test(tenantId)) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    req.tenantId = tenantId;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
}

module.exports = requireTenant;