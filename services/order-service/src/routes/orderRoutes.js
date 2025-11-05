const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getUserOrders,
  getRestaurantOrders
} = require('../controllers/orderController');

router.route('/')
  .get(getAllOrders)
  .post(createOrder);

router.route('/:id')
  .get(getOrder);

router.put('/:id/status', updateOrderStatus);
router.put('/:id/cancel', cancelOrder);

router.get('/user/:userId', getUserOrders);
router.get('/restaurant/:restaurantId', getRestaurantOrders);

module.exports = router;
