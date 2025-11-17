const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const cart = require('../controllers/cartController');
const order = require('../controllers/orderController');

router.use(authenticate);

// cart
router.get('/cart', cart.getCart);
router.post('/cart/items', cart.addItem);
router.patch('/cart/items/:itemId', cart.updateItem);
router.delete('/cart/items/:itemId', cart.removeItem);
router.delete('/cart', cart.clearCart);
router.post('/cart/checkout', cart.checkout);

// history
router.get('/', order.listOrders);
router.get('/:orderId', order.getOrder);

module.exports = router;

