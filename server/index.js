require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./db');

const packageRoutes = require('./routes/packages');
const mpesaRoutes = require('./routes/mpesa');
const purchaseRoutes = require('./routes/purchase');
const sessionsRoutes = require('./routes/sessions');

const { getAllSessions, expireOldSessions } = require('./services/sessionService');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Proxy & Core Security Middleware (Must come BEFORE routes)
app.set('trust proxy', 1);
app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins
}));

app.use(express.json({ limit: '10kb' }));

// 2. Rate Limiters
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  skip: (req) => req.originalUrl.startsWith('/api/mpesa/callback'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const purchaseLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many purchase attempts. Please wait 10 minutes before trying again.' }
});

app.use('/api/', apiLimiter);
app.use('/api/purchase', purchaseLimiter);

// 3. Health & Admin Routes
app.get('/', (req, res) => {
  res.json({ status: 'server is running' });
});

app.get('/test-sessions', async (req, res) => {
  const adminKey = process.env.ADMIN_KEY;
  const providedKey = req.headers['x-admin-key'] || '';

  if (
    !adminKey ||
    providedKey.length !== adminKey.length ||
    !crypto.timingSafeEqual(Buffer.from(providedKey), Buffer.from(adminKey))
  ) {
    return res.status(404).end();
  }

  try {
    const sessions = await getAllSessions();
    res.json(sessions);
  } catch (err) {
    console.error('GET /test-sessions failed:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// 4. API Routes
app.use('/api/packages', packageRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/sessions', sessionsRoutes);

// 5. Global Error Handler (Must come AFTER all routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

// 6. Background Jobs & Process Listeners
setInterval(async () => {
  try {
    await expireOldSessions();
  } catch (err) {
    console.error('Session expiry sweep failed:', err);
  }
}, 60 * 1000);

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});