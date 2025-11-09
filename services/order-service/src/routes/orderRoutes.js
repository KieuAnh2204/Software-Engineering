const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const orderCreationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many order attempts, please try again shortly'
});

router.use(authenticate);

router
  .route('/')
  .post(orderCreationLimiter, createOrder)
  .get(getOrders);

router
  .route('/:id')
  .get(getOrderById);

router.put(
  '/:id/status',
  authorize('restaurant', 'BRAND_MANAGER', 'admin'),
  updateOrderStatus
);

module.exports = router;
