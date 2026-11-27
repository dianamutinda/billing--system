const jwt = require('jsonwebtoken');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    console.error('Admin JWT secret is missing or too short');
    return res.status(500).json({ error: 'Server authentication misconfigured' });
  }

  const token = req.cookies?.admin_token;
  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    });

    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const adminId = typeof payload.sub === 'string' ? payload.sub.trim() : '';
    if (!UUID_RE.test(adminId)) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    req.adminId = adminId;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
}

module.exports = requireAdmin;