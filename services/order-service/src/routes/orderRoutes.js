const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createOrderValidation, listOrdersValidation } = require('../validators/orderValidators');
const {
  createOrder,
  getOrderById,
  listOrders,
  createPaymentIntent,
  vnpayWebhook,
  restaurantConfirm,
  completeOrder,
  cancelOrder
} = require('../controllers/orderController');

// Create order (customer auth required)
router.post('/', authenticate, createOrderValidation, createOrder);

// Read
router.get('/:id', authenticate, getOrderById);
router.get('/', authenticate, listOrdersValidation, listOrders);

// Payments
router.post('/:id/pay', authenticate, createPaymentIntent);
router.post('/payment/webhook/vnpay', vnpayWebhook); // called by payment-service

// Restaurant actions
router.post('/:id/restaurant-confirm', authenticate, authorize('restaurant', 'restaurantBrand', 'admin'), restaurantConfirm);
router.post('/:id/complete', authenticate, completeOrder);
router.post('/:id/cancel', authenticate, cancelOrder);

module.exports = router;
