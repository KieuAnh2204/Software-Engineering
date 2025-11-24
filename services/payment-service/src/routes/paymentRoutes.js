// src/routes/paymentRoutes.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const paymentCtrl = require('../controllers/paymentController');
const vnpayCtrl = require('../controllers/vnpayController');

// rate-limit for IPN to avoid abuse
const ipnLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });

// Legacy/payment intents (disabled for VNPAY-only; returns 501)
router.post('/create-intent', paymentCtrl.createPaymentIntent);
router.post('/:id/confirm', paymentCtrl.confirmPayment);
router.post('/:id/refund', paymentCtrl.confirmPayment); // same handler returns 501
router.get('/:id', paymentCtrl.getPayment);
router.get('/order/:orderId', paymentCtrl.getPaymentByOrder);
router.get('/user/:userId', paymentCtrl.getUserPayments);

// VNPAY routes
router.post('/vnpay/create', vnpayCtrl.createVNPayPayment);
router.get('/vnpay/return', vnpayCtrl.vnpayReturn);
router.all('/vnpay/ipn', ipnLimiter, vnpayCtrl.vnpayIpn); // handle GET/POST

module.exports = router;
