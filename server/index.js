require('dotenv').config();
const express = require('express');
const cors = require('cors');
const packageRoutes = require('./routes/packages');
const { getAccessToken } = require('./services/paymentService');
const { initiateStkPush, pendingTransactions } = require('./services/paymentService');
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


app.get('/test-all', (req, res) => {
  res.json([...pendingTransactions.entries()]);
});

app.use('/api/packages', packageRoutes);
app.use('/api/mpesa', mpesaRoutes)

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});