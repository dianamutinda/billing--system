require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const packageRoutes = require('./routes/packages');
const mpesaRoutes = require('./routes/mpesa');
const purchaseRoutes = require('./routes/purchase');
const sessionsRoutes = require('./routes/sessions');

const { getAllSessions, expireOldSessions } = require('./services/sessionService');

const app = express();
const PORT = process.env.PORT;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'server is running' });
});


app.get('/test-sessions', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
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

app.use('/api/packages', packageRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/sessions', sessionsRoutes);

setInterval(expireOldSessions, 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});