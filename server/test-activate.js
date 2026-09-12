require('dotenv').config();
const { activate } = require('./services/networkService');

const fakeSession = {
  phone_number: '254712345678',
  expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
};

activate(fakeSession).then((result) => {
  console.log('Result:', result);
});