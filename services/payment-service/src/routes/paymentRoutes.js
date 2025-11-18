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
  vnpayCallback,
  queryPaymentStatus,
  refundTransaction,
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
router.get('/vnpay/callback', vnpayCallback);
router.get('/vnpay/query', queryPaymentStatus);
router.post('/vnpay/refund', refundTransaction);

module.exports = router;
