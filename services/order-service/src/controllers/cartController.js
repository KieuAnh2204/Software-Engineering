const Order = require('../models/Order');
const {
  getOrCreateCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  recalcTotal,
} = require('../services/cartService');
const { getIO } = require('../socket');
const { AppError } = require('../utils/appError');

const paymentMethods = ['cod', 'vnpay', 'momo', 'card'];

exports.getCart = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { restaurant_id } = req.query;
    if (!restaurant_id) {
      return res
        .status(400)
        .json({ message: 'restaurant_id is required' });
    }
    const cart = await getOrCreateCart(customer_id, restaurant_id);
    res.json(cart);
  } catch (e) {
    next(e);
  }
};

exports.addItem = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { restaurant_id, productId, quantity, notes } = req.body;
    if (!restaurant_id || !productId) {
      return res.status(400).json({
        message: 'restaurant_id and productId are required',
      });
    }

    const cart = await addItemToCart({
      customer_id,
      restaurant_id,
      productId,
      quantity,
      notes,
    });
    res.json(cart);
  } catch (e) {
    next(e);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { restaurant_id, quantity, notes } = req.body;
    const { itemId } = req.params;
    if (!restaurant_id) {
      return res
        .status(400)
        .json({ message: 'restaurant_id is required' });
    }

    const cart = await updateCartItem({
      customer_id,
      restaurant_id,
      itemId,
      quantity,
      notes,
    });
    res.json(cart);
  } catch (e) {
    next(e);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { restaurant_id } = { ...req.query, ...req.body };
    const { itemId } = req.params;
    if (!restaurant_id) {
      return res
        .status(400)
        .json({ message: 'restaurant_id is required' });
    }

    const cart = await removeCartItem({
      customer_id,
      restaurant_id,
      itemId,
    });
    res.json(cart);
  } catch (e) {
    next(e);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { restaurant_id } = req.body;
    if (!restaurant_id) {
      return res
        .status(400)
        .json({ message: 'restaurant_id is required' });
    }
    const cart = await clearCart({ customer_id, restaurant_id });
    res.json(cart || { message: 'No active cart' });
  } catch (e) {
    next(e);
  }
};

exports.checkout = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { restaurant_id, long_address, payment_method } = req.body;
    if (!restaurant_id || !payment_method) {
      return res.status(400).json({
        message: 'restaurant_id and payment_method are required',
      });
    }
    if (!paymentMethods.includes(payment_method)) {
      throw AppError.badRequest('payment_method is invalid');
    }
    if (long_address !== undefined && typeof long_address !== 'string') {
      throw AppError.badRequest('long_address must be a string');
    }

    const order = await Order.findOne({
      customer_id,
      restaurant_id,
      status: 'cart',
    });
    if (!order || order.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    if (order.expires_at && order.expires_at < new Date()) {
      order.status = 'expired';
      order.updated_at = new Date();
      await order.save();
      throw AppError.badRequest('Cart expired, please start a new cart');
    }

    recalcTotal(order);
    order.long_address = long_address;
    order.payment_method = payment_method;
    order.status = 'submitted';
    order.payment_status =
      payment_method === 'cod' ? 'unpaid' : 'pending';
    order.submitted_at = new Date();
    order.updated_at = new Date();
    await order.save();

    // Broadcast to customer and restaurant listeners
    const io = getIO();
    if (io) {
      io.to(`customer-${order.customer_id}`).emit('order:update', order);
      io.to(`restaurant-${order.restaurant_id}`).emit('order:update', order);
    }

    // Optional: integrate with PAYMENT_SERVICE_URL here for non-COD

    res.json({ order });
  } catch (e) {
    next(e);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { restaurant_id, long_address } = req.body;
    if (!restaurant_id) {
      return res
        .status(400)
        .json({ message: 'restaurant_id is required' });
    }
    if (!long_address || typeof long_address !== 'string') {
      return res
        .status(400)
        .json({ message: 'long_address is required' });
    }

    const order = await Order.findOne({
      customer_id,
      restaurant_id,
      status: 'cart',
    });
    if (!order) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    order.long_address = long_address;
    order.updated_at = new Date();
    await order.save();

    res.json(order);
  } catch (e) {
    next(e);
  }
};

