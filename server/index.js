require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const packageRoutes = require('./routes/packages');
const mpesaRoutes = require('./routes/mpesa');
const purchaseRoutes = require('./routes/purchase');

const { getAllSessions, expireOldSessions } = require('./services/sessionService');

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'server is running' });
});


app.get('/test-sessions', async (req, res) => {
  try {
    const sessions = await getAllSessions();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/packages', packageRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/purchase', purchaseRoutes);

setInterval(expireOldSessions, 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});