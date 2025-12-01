const express = require('express');
const axios = require('axios');
const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require('vnpay');

const app = express();

const {
  PORT = 3000,
  ORDER_SERVICE_URL = 'http://order-service:3002',
  PAYMENT_WEBHOOK_SECRET = '',
  VNPAY_TMN_CODE = '',
  VNPAY_HASH_SECRET = '',
  VNPAY_PAYMENT_URL = 'https://sandbox.vnpayment.vn',
  VNPAY_RETURN_URL = 'http://localhost:3000/api/check-payment-vnpay',
} = process.env;

const vnpay = new VNPay({
  tmnCode: VNPAY_TMN_CODE,
  secureSecret: VNPAY_HASH_SECRET,
  vnpayHost: VNPAY_PAYMENT_URL,
  testMode: true,
  hashAlgorithm: 'SHA512',
  loggerFn: ignoreLogger,
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'pay-service' });
});

const mapVnpResponseCode = (code) => {
  if (code === '00') return 'success';
  if (code === '07' || code === '09') return 'pending';
  return 'failed';
};

const appendQuery = (url, params) => {
  const qs = new URLSearchParams(params);
  return url.includes('?') ? `${url}&${qs.toString()}` : `${url}?${qs.toString()}`;
};

const fetchOrder = async (orderId, authHeader) => {
  if (!authHeader) {
    const err = new Error('Authorization header is required to fetch order');
    err.status = 401;
    throw err;
  }
  try {
    const res = await axios.get(
      `${ORDER_SERVICE_URL}/api/orders/${orderId}`,
      {
        headers: { Authorization: authHeader },
      }
    );
    return res.data;
  } catch (err) {
    const status = err.response?.status || 500;
    const message =
      err.response?.data?.message || err.message || 'Failed to fetch order';
    const wrapped = new Error(message);
    wrapped.status = status;
    throw wrapped;
  }
};

const notifyOrderService = async ({ orderId, status, transactionId }) => {
  if (!orderId || !status || !PAYMENT_WEBHOOK_SECRET) return;
  await axios.post(
    `${ORDER_SERVICE_URL}/api/orders/payment/callback`,
    {
      orderId,
      status,
      transaction_id: transactionId,
      provider: 'vnpay',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-payment-signature': PAYMENT_WEBHOOK_SECRET,
      },
    }
  );
};

app.post('/api/create-qr', async (req, res) => {
  try {
    const { orderId, bankCode } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }
    if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET) {
      return res
        .status(500)
        .json({ message: 'VNPAY credentials are not configured' });
    }

    const authHeader = req.headers.authorization;
    const order = await fetchOrder(orderId, authHeader);

    const amount = Number(order?.total_amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ message: 'Order has invalid amount for payment' });
    }

    const txnRef = `${orderId}-${Date.now()}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const clientIp =
      req.headers['x-forwarded-for']?.split(',')?.[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    // VNPay multiplies internally by 100; divide here to avoid double-scaling (e.g., 36000 -> 360 -> VNPay shows 36000)
    const vnpAmount = Math.max(1, Math.round(amount / 100));

    const vnpayResponse = await vnpay.buildPaymentUrl({
      vnp_Amount: vnpAmount,
      vnp_IpAddr: clientIp,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `order:${orderId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: appendQuery(VNPAY_RETURN_URL, { orderId }),
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
      ...(bankCode ? { vnp_BankCode: bankCode } : {}),
    });

    const paymentUrl =
      typeof vnpayResponse === 'string'
        ? vnpayResponse
        : vnpayResponse?.paymentUrl ||
          vnpayResponse?.vnpUrl ||
          vnpayResponse?.url ||
          vnpayResponse;

    return res.status(201).json({
      orderId,
      amount,
      txnRef,
      paymentUrl,
      raw: vnpayResponse,
    });
  } catch (err) {
    const status = err.status || 500;
    return res
      .status(status)
      .json({ message: err.message || 'Unable to create VNPay QR' });
  }
});

app.get('/api/check-payment-vnpay', async (req, res) => {
  try {
    const orderId =
      req.query.orderId ||
      (req.query.vnp_OrderInfo || '').replace('order:', '');
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }
    const status = mapVnpResponseCode(req.query.vnp_ResponseCode);
    const transactionId =
      req.query.vnp_TransactionNo || req.query.vnp_TxnRef || null;

    try {
      await notifyOrderService({ orderId, status, transactionId });
    } catch (notifyErr) {
      console.error('Failed to notify order-service:', notifyErr.message);
      return res
        .status(502)
        .json({ message: 'Failed to notify order-service', status });
    }

    return res.status(200).json({
      received: true,
      orderId,
      status,
      transactionId,
      vnp_ResponseCode: req.query.vnp_ResponseCode,
    });
  } catch (err) {
    const status = err.status || 500;
    return res
      .status(status)
      .json({ message: err.message || 'Unable to process payment return' });
  }
});

app.listen(PORT, () => {
  console.log(`pay-service listening on port ${PORT}`);
});
