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

router.post('/create-intent', createPaymentIntent);
router.post('/:id/confirm', confirmPayment);
router.post('/:id/refund', refundPayment);

router.get('/:id', getPayment);
router.get('/order/:orderId', getPaymentByOrder);
router.get('/user/:userId', getUserPayments);

module.exports = router;
