const axios = require('axios');
const Payment = require('../models/Payment');
const { buildPaymentUrl, verifyParams, config: vnpConfig } = require('../utils/vnpay');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || '';

const mapResponseCodeToStatus = (code) => {
  if (code === '00') return 'paid';
  if (code === '07' || code === '09') return 'pending';
  return 'failed';
};

const notifyOrderService = async ({ orderId, status, transaction_id }) => {
  if (!ORDER_SERVICE_URL) return;
  try {
    await axios.post(
      `${ORDER_SERVICE_URL}/api/orders/payment/callback`,
      {
        orderId,
        status: status === 'paid' ? 'success' : status === 'pending' ? 'pending' : 'failed',
        transaction_id,
        provider: 'vnpay',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-payment-signature': PAYMENT_WEBHOOK_SECRET || '',
        },
      }
    );
  } catch (err) {
    console.error('Failed to notify order-service:', err?.message || err);
  }
};

exports.createVNPayPayment = async (req, res, next) => {
  try {
    const { orderId, userId, amount, orderInfo, returnUrl, bankCode } = req.body;
    if (!orderId || !userId || !amount) {
      return res.status(400).json({ message: 'orderId, userId, and amount are required' });
    }

    // Create Payment record first to get an id/txnRef
    const txnRef = `${Date.now()}`;
    const payment = await Payment.create({
      orderId,
      userId,
      amount,
      currency: 'VND',
      provider: 'vnpay',
      status: 'created',
      vnp_TxnRef: txnRef,
      returnUrl: returnUrl || vnpConfig.returnUrl,
    });

    const { paymentUrl, params } = buildPaymentUrl({
      vnp_TxnRef: txnRef,
      amount,
      orderInfo,
      ipAddr:
        req.headers['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        '127.0.0.1',
      bankCode,
      returnUrl,
    });

    payment.paymentUrl = paymentUrl;
    payment.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await payment.save();

    res.status(201).json({
      success: true,
      paymentUrl,
      paymentId: payment._id,
      vnp_TxnRef: txnRef,
    });
  } catch (error) {
    next(error);
  }
};

const handleVnpayResult = async (query, isIpn = false) => {
  const { valid, cleaned } = verifyParams(query);
  if (!valid) {
    return { ok: false, code: '97', message: 'Invalid signature' };
  }

  const txnRef = cleaned.vnp_TxnRef;
  const payment = await Payment.findOne({ vnp_TxnRef: txnRef });
  if (!payment) {
    return { ok: false, code: '01', message: 'Payment not found' };
  }

  // Only process if not already paid (idempotent)
  const responseCode = cleaned.vnp_ResponseCode;
  const status = mapResponseCodeToStatus(responseCode);

  payment.vnp_ResponseCode = responseCode;
  payment.vnp_TransactionNo = cleaned.vnp_TransactionNo;
  payment.vnp_BankCode = cleaned.vnp_BankCode;
  payment.vnp_CardType = cleaned.vnp_CardType;
  payment.vnp_PayDate = cleaned.vnp_PayDate;
  payment.checksumVerified = true;
  if (isIpn) payment.webhookVerified = true;
  payment.status = status;
  if (status === 'paid') payment.paidAt = new Date();
  payment.amount = payment.amount || cleaned.vnp_Amount / 100;
  await payment.save();

  await notifyOrderService({
    orderId: payment.orderId,
    status,
    transaction_id: payment.vnp_TransactionNo,
  });

  return { ok: true, status, payment };
};

exports.vnpayReturn = async (req, res, next) => {
  try {
    const result = await handleVnpayResult(req.query, false);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Redirect to frontend if configured
    const baseFront = process.env.FRONTEND_URL;
    if (baseFront) {
      const target =
        result.status === 'paid'
          ? `${baseFront}/payment/vnpay/success?orderId=${result.payment.orderId}`
          : `${baseFront}/payment/vnpay/failed?orderId=${result.payment.orderId}`;
      return res.redirect(target);
    }
    return res.json({
      success: true,
      status: result.status,
      paymentId: result.payment._id,
      orderId: result.payment.orderId,
    });
  } catch (err) {
    next(err);
  }
};

exports.vnpayIpn = async (req, res, next) => {
  try {
    const result = await handleVnpayResult({ ...(req.body || {}), ...(req.query || {}) }, true);
    if (!result.ok) {
      return res.status(400).json({
        RspCode: result.code || '99',
        Message: result.message || 'Invalid',
      });
    }
    return res.json({ RspCode: '00', Message: 'Success' });
  } catch (err) {
    next(err);
  }
};
