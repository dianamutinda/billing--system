require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rl = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Works with express-rate-limit v7 and v8
const rateLimit = rl.rateLimit || rl;
const ipKeyGenerator = rl.ipKeyGenerator || ((ip) => ip);

const packageRoutes = require('./routes/packages');
const mpesaRoutes = require('./routes/mpesa');
const purchaseRoutes = require('./routes/purchase');
const sessionsRoutes = require('./routes/sessions');
const adminAuthRoutes = require('./routes/adminAuth');
const requireAdmin = require('./middleware/requireAdmin');
const adminTenantsRoutes = require('./routes/adminTenants');
const tenantAuthRoutes = require('./routes/tenantAuth');

const {
  getAllSessionsForOwner,
  expireOldSessions,
  activatePendingSessions,
} = require('./services/sessionService');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Proxy & core security middleware (must come BEFORE routes)
app.set('trust proxy', 1);
app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 2. Rate limiters
// Customers at one venue share one public IP, so limits are keyed on what
// identifies the abuse (token / phone), with looser per-IP limits as a backstop.
const common = { standardHeaders: true, legacyHeaders: false };

// General backstop. The M-Pesa callback and status polling are handled separately.
const apiLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  max: 300,
  skip: (req) =>
    req.originalUrl.startsWith('/api/mpesa/callback') ||
    req.originalUrl.startsWith('/api/sessions/status'),
  message: { error: 'Too many requests, please try again later.' },
});

// Status polling: per session token (the frontend polls every 3s)
const statusLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  max: 40,
  keyGenerator: (req) => String(req.body?.token || ipKeyGenerator(req.ip)),
  message: { error: 'Too many status checks, please slow down.' },
});

// Status polling: loose per-IP backstop so random tokens can't bypass the per-token limit
const statusIpLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  max: 1200,
  message: { error: 'Too many status checks, please slow down.' },
});

// Purchases: each one sends a real STK push to someone's phone, so limit per phone number
const purchasePerPhone = rateLimit({
  ...common,
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => String(req.body?.phone || ipKeyGenerator(req.ip)),
  message: { error: 'Too many attempts for this number. Please wait 10 minutes.' },
});

// Purchases: loose per-IP backstop so rotating phone numbers doesn't bypass the above
const purchasePerIp = rateLimit({
  ...common,
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: { error: 'Too many purchase attempts. Please wait and try again.' },
});

app.use('/api/', apiLimiter);
app.use('/api/sessions/status', statusIpLimiter, statusLimiter);
app.use('/api/purchase', purchasePerIp, purchasePerPhone);
app.use('/api/tenant/router', require('./routes/tenantRouter'));
app.use('/api/admin/sessions', require('./routes/adminSessions'));

// 3. Health & admin routes
app.get('/', (req, res) => {
  res.json({ status: 'server is running' });
});

// 4. API routes
app.use('/api/packages', packageRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/tenants', requireAdmin, adminTenantsRoutes);
app.use('/api/tenant', tenantAuthRoutes);
app.use('/api/tenant/packages', require('./routes/tenantPackages'));
app.use('/api/portal', require('./routes/portal'));
app.use('/api/tenant/payment-settings', require('./routes/tenantPaymentSettings'));
app.use('/api/tenant/transactions', require('./routes/tenantTransactions'));
app.use('/api/tenant/sessions', require('./routes/tenantSessions'));
app.use('/api/tenant/dashboard', require('./routes/tenantDashboard'));
app.use('/api/tenant/business', require('./routes/tenantBusiness'));

// 5. Global error handler (must come AFTER all routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

// 6. Background jobs & process listeners
setInterval(async () => {
  try {
    await expireOldSessions();
  } catch (err) {
    console.error('Session expiry sweep failed:', err.message);
  }
}, 60 * 1000);

setInterval(async () => {
  try {
    await activatePendingSessions();
  } catch (err) {
    console.error('Activation retry failed:', err.message);
  }
}, 30 * 1000);

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

