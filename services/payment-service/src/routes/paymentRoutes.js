const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  getPayment,
  getPaymentByOrder,
  refundPayment,
  getUserPayments
} = require('../controllers/paymentController');

const {
  createVNPayPayment,
  vnpayReturn,
  vnpayIpn,
} = require('../controllers/vnpayController');

// Existing payment routes
router.post('/create-intent', createPaymentIntent);
router.post('/:id/confirm', confirmPayment);
router.post('/:id/refund', refundPayment);

router.get('/:id', getPayment);
router.get('/order/:orderId', getPaymentByOrder);
router.get('/user/:userId', getUserPayments);

// VNPAY routes
router.post('/vnpay/create', createVNPayPayment);
router.get('/vnpay/return', vnpayReturn);
router.post('/vnpay/ipn', vnpayIpn);
router.get('/vnpay/ipn', vnpayIpn); // fallback if VNPAY sends GET

module.exports = router;
