const { createHttpClient, withRetries } = require('../utils/http');

const baseUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';
const http = createHttpClient(baseUrl);

async function createIntent(orderId, amount) {
  return withRetries(async () => {
    const res = await http.post(`/payments/intents`, {
      orderId,
      amount,
      provider: 'vnpay'
    });
    return res.data || {};
  });
}

module.exports = { createIntent };

