const jwt = require('jsonwebtoken');

function requireTenant(req, res, next) {
  const token = req.cookies?.tenant_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    if (payload.role !== 'tenant') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.tenantId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
}

module.exports = requireTenant;