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

async function createVNPayPayment({ orderId, amount, orderInfo, returnUrl }) {
  return withRetries(async () => {
    const res = await http.post(`/api/payments/vnpay/create`, {
      orderId,
      amount,
      orderInfo,
      returnUrl,
    });
    return res.data || {};
  });
}

module.exports = { createIntent, createVNPayPayment };

