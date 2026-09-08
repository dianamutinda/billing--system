require('dotenv').config();
const express = require('express');
const cors = require('cors');
const packageRoutes = require('./routes/packages');
const { getAccessToken } = require('./services/paymentService');

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

app.use('/api/packages', packageRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});