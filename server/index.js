require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const packageRoutes = require('./routes/packages');
const mpesaRoutes = require('./routes/mpesa');

const { getAccessToken, initiateStkPush } = require('./services/paymentService');
const { getPackageById } = require('./services/packageService');
const { createSession, getAllSessions, expireOldSessions } = require('./services/sessionService');
const { activate } = require('./services/networkService');

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

app.post('/test-stk', async (req, res) => {
  try {
    const { phone, packageId } = req.body;
    const result = await initiateStkPush(phone, packageId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/test-force-session', async (req, res) => {
  try {
    const pkg = await getPackageById('1hr');
    const fakeTransaction = { phone: '254708374149' };
    const session = await createSession(fakeTransaction, pkg);
    await activate(session);
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/test-sessions', async (req, res) => {
  try {
    const sessions = await getAllSessions();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
app.use('/api/mpesa', mpesaRoutes);

setInterval(expireOldSessions, 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});