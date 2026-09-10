require('dotenv').config();

console.log('DB URL loaded:', process.env.DATABASE_URL ? 'yes' : 'NO - MISSING');

const express = require('express');
const cors = require('cors');
const packageRoutes = require('./routes/packages');
const { getAccessToken } = require('./services/paymentService');
const { initiateStkPush, pendingTransactions } = require('./services/paymentService');
const { sessions, createSession } = require('./services/sessionService');
const { getPackageById } = require('./services/packageService');
const { activate, revoke } = require('./services/networkService');
const {expireOldSessions} = require('./services/sessionService')
const pool = require('./db')

const mpesaRoutes = require('./routes/mpesa')

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'server is running' });
});

app.get('/test-token', async (req, res) => {
  const token = await getAccessToken();
  res.json({ token });
});

app.post('/test-stk', async (req,res) => {
  try {
    const {phone, packageId} = req.body;
    const result = await initiateStkPush(phone, packageId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/test-force-session', async (req, res) => {
  const pkg = getPackageById('1hr');
  const fakeTransaction = { phone: '254708374149', packageId: '1hr' };
  const session = createSession(fakeTransaction, pkg);
  await activate(session);
  res.json(session);
});

app.get('/test-quick-session', async (req, res) => {
  const pkg = getPackageById('1hr');
  const fakeTransaction = { phone: '254708374149', packageId: '1hr' };
  const session = createSession(fakeTransaction, pkg);

  // Override expiresAt to 10 seconds from now, just for this test
  session.expiresAt = new Date(Date.now() + 10 * 1000).toISOString();
  sessions.set(session.id, session);

  res.json(session);
});


app.get('/test-all', (req, res) => {
  res.json([...pendingTransactions.entries()]);
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM packages');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/packages', packageRoutes);
app.use('/api/mpesa', mpesaRoutes)

setInterval(expireOldSessions, 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});