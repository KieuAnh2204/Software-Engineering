const crypto = require('crypto');
const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const { getProduct } = require('../clients/productClient');
const { createIntent } = require('../clients/paymentClient');
const { canTransition } = require('../services/stateMachine');

function genId(prefix) {
  if (crypto.randomUUID) return prefix + '_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return prefix + '_' + (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
}

function deliveryFeeFor(now) {
  return 0; // hook for future distance-based calc
}

// POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation Error', errors: errors.array() });
    }

    const { customer_id, restaurant_id, items, note } = req.body;

    // Auth: ensure the caller is the customer creating own order
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    if (req.user.id !== customer_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: cannot create for another customer' });
    }

    // Fetch product details and validate single-restaurant invariant
    let subtotal = 0;
    const snapshots = [];
    for (const it of items) {
      const prod = await getProduct(it.dish_id);
      if (!prod) return res.status(400).json({ success: false, message: `Product not found: ${it.dish_id}` });
      if (prod.available !== true) {
        return res.status(400).json({ success: false, message: `Product not available: ${prod.dish_id || it.dish_id}` });
      }
      const prodRestaurantId = prod.restaurant_id || prod.restaurantId || prod.restaurant;
      if (!prodRestaurantId || prodRestaurantId !== restaurant_id) {
        return res.status(400).json({ success: false, message: 'All items must belong to the same restaurant' });
      }
      const price = Number(prod.price || 0);
      const quantity = Number(it.quantity || 0);
      subtotal += price * quantity;
      snapshots.push({
        order_item_id: genId('oi'),
        dish_id: prod.dish_id || prod._id || it.dish_id,
        dish_name: prod.name,
        price,
        quantity,
        dish_image_url: prod.image_url || prod.image,
        category: prod.category,
        restaurant_id: prodRestaurantId
      });
    }

    const deliveryFee = deliveryFeeFor(new Date());
    const total_amount = subtotal + deliveryFee;

    const order_id = genId('ord');
    const orderDoc = await Order.create({
      order_id,
      customer_id,
      restaurant_id,
      note,
      total_amount,
      status: 'Pending'
    });

    const itemsToInsert = snapshots.map((s) => ({ ...s, order_id }));
    await OrderItem.insertMany(itemsToInsert);

    return res.status(201).json({
      success: true,
      data: {
        order_id: orderDoc.order_id,
        status: orderDoc.status,
        total_amount: orderDoc.total_amount,
        customer_id: orderDoc.customer_id,
        restaurant_id: orderDoc.restaurant_id,
        items: itemsToInsert,
        note: orderDoc.note,
        created_at: orderDoc.created_at
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
exports.getOrderById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const order = await Order.findOne({ order_id: id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // Ownership/role check: customer owner, restaurant owner (matching restaurant_id), or admin
    if (req.user?.role !== 'admin') {
      const isCustomerOwner = req.user?.id === order.customer_id;
      const isRestaurant = req.user?.role === 'restaurant' || req.user?.role === 'restaurantBrand';
      if (!isCustomerOwner && !isRestaurant) return res.status(403).json({ message: 'Forbidden' });
    }
    const items = await OrderItem.find({ order_id: order.order_id });
    return res.status(200).json({ success: true, data: { ...order.toObject(), items } });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders
exports.listOrders = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation Error', errors: errors.array() });

    const {
      customer_id,
      restaurant_id,
      status,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = req.query;

    const q = {};
    if (customer_id) q.customer_id = customer_id;
    if (restaurant_id) q.restaurant_id = restaurant_id;
    if (status) q.status = status;
    if (start_date || end_date) {
      q.created_at = {};
      if (start_date) q.created_at.$gte = new Date(start_date);
      if (end_date) q.created_at.$lte = new Date(end_date);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Order.find(q).sort({ created_at: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(q)
    ]);

    return res.status(200).json({ success: true, data: items, page: Number(page), limit: Number(limit), total });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/:id/pay
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const id = req.params.id;
    const order = await Order.findOne({ order_id: id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // Only owner or admin can create payment intent
    if (req.user?.role !== 'admin' && req.user?.id !== order.customer_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const intent = await createIntent(order.order_id, order.total_amount);
    const payment_id = intent.id || intent.payment_id;
    const checkoutUrl = intent.checkoutUrl || intent.checkout_url;
    const qrData = intent.qrData || intent.qr_data;

    order.meta = order.meta || {};
    order.meta.payment = {
      payment_id,
      provider: 'vnpay',
      last_status: 'Pending',
      checkout_url: checkoutUrl,
      qr_data: qrData,
      last_updated_at: new Date()
    };
    await order.save();

    return res.status(200).json({ success: true, data: { payment_id, checkoutUrl, qrData } });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/payment/webhook/vnpay
exports.vnpayWebhook = async (req, res, next) => {
  try {
    const secret = process.env.VNPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(500).json({ message: 'Webhook secret not configured' });
    const signature = req.headers['x-signature'] || req.body.signature;
    if (!signature) return res.status(400).json({ message: 'Missing signature' });

    // Verify HMAC-SHA256 over the body without signature field
    const payload = { ...req.body };
    delete payload.signature;
    const computed = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    if (computed !== signature) return res.status(401).json({ message: 'Invalid signature' });

    const { orderId, status, amount, paymentId } = req.body;
    const order = await Order.findOne({ order_id: orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Idempotency: ignore duplicate status
    const last = order.meta?.payment?.last_status;
    if (last === status) return res.status(200).json({ success: true, data: { idempotent: true } });

    if (status === 'Success') {
      if (!canTransition(order.status, 'Processing')) return res.status(409).json({ message: 'Invalid transition' });
      order.status = 'Processing';
    } else if (status === 'Failed') {
      order.status = 'Cancelled';
    }
    order.meta = order.meta || {};
    order.meta.payment = {
      ...(order.meta.payment || {}),
      payment_id: paymentId || order.meta.payment?.payment_id,
      last_status: status,
      last_updated_at: new Date()
    };
    await order.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/:id/restaurant-confirm
exports.restaurantConfirm = async (req, res, next) => {
  try {
    const id = req.params.id;
    const order = await Order.findOne({ order_id: id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // Role guard: restaurant or admin
    if (req.user?.role !== 'admin' && !['restaurant', 'restaurantBrand'].includes(req.user?.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!canTransition(order.status, 'Delivering')) return res.status(409).json({ message: 'Invalid transition' });
    order.status = 'Delivering';
    await order.save();
    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/:id/complete
exports.completeOrder = async (req, res, next) => {
  try {
    const id = req.params.id;
    const order = await Order.findOne({ order_id: id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // Role guard: restaurant, delivery, or admin (simplified to any authenticated)
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    if (!canTransition(order.status, 'Completed')) return res.status(409).json({ message: 'Invalid transition' });
    order.status = 'Completed';
    await order.save();
    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/:id/cancel
exports.cancelOrder = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { reason } = req.body || {};
    const order = await Order.findOne({ order_id: id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // Permissions: customer owner, restaurant, or admin
    const isOwner = req.user?.id === order.customer_id;
    const isRestaurant = ['restaurant', 'restaurantBrand'].includes(req.user?.role);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isRestaurant && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    // Allow from Pending, Processing, Delivering
    if (!['Pending', 'Processing', 'Delivering'].includes(order.status)) {
      return res.status(409).json({ message: 'Cannot cancel in current status' });
    }
    order.status = 'Cancelled';
    order.meta = order.meta || {};
    order.meta.cancellation = { reason, cancelled_by: req.user?.id, at: new Date() };
    await order.save();
    // If paid, TODO: emit refund-intent (stub)
    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

