require('dotenv').config();
const { revoke } = require('./services/networkService');

const fakeSession = {
  phone_number: '254712345678',
};

revoke(fakeSession).then((result) => {
  console.log('Result:', result);
});