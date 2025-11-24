const Order = require('../models/Order');
const { getIO } = require('../socket');

const PAYMENT_SECRET_HEADER = 'x-payment-signature';

const canAutoConfirmStatuses = [
  'submitted',
  'payment_pending',
  'payment_failed',
];

const ORDER_STATUSES = [
  'cart',
  'submitted',
  'payment_pending',
  'payment_failed',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'delivering',
  'completed',
  'cancelled',
  'expired',
];

exports.listOrders = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const defaultStatuses = [
      'submitted',
      'payment_pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'delivering',
      'completed',
      'cancelled',
      'payment_failed',
    ];
    const statuses = (status
      ? String(status).split(',')
      : defaultStatuses
    )
      .map((s) => s.trim())
      .filter((s) => ORDER_STATUSES.includes(s));
    if (statuses.length === 0) {
      return res
        .status(400)
        .json({ message: 'No valid statuses provided' });
    }

    const q = { customer_id, status: { $in: statuses } };
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Order.find(q)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(q),
    ]);

    res.json({
      items,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (e) {
    next(e);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId, customer_id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (e) {
    next(e);
  }
};

exports.mockMarkPaid = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only the owning customer or an admin can mark paid
    if (role !== 'admin' && String(order.customer_id) !== String(userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // If already paid, just return current state
    if (order.payment_status === 'paid') {
      return res.json({ order, alreadyPaid: true });
    }

    order.payment_status = 'paid';
    if (
      order.status === 'submitted' ||
      order.status === 'payment_pending' ||
      order.status === 'payment_failed'
    ) {
      order.status = 'confirmed';
    }
    order.paid_at = new Date();
    order.updated_at = new Date();
    await order.save();

    // Broadcast payment/status change
    const io = getIO();
    if (io) {
      io.to(`customer-${order.customer_id}`).emit('order:update', order);
      io.to(`restaurant-${order.restaurant_id}`).emit('order:update', order);
    }

    res.json({ order });
  } catch (e) {
    next(e);
  }
};

exports.paymentCallback = async (req, res, next) => {
  try {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({ message: 'PAYMENT_WEBHOOK_SECRET not configured' });
    }
    const sig =
      req.headers[PAYMENT_SECRET_HEADER] ||
      req.headers[PAYMENT_SECRET_HEADER.toLowerCase()];
    if (sig !== secret) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const { orderId, status, transaction_id, provider } = req.body;
    if (!orderId || !status) {
      return res
        .status(400)
        .json({ message: 'orderId and status are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const normalized = String(status).toLowerCase();
    let changed = false;

    if (normalized === 'success' || normalized === 'paid') {
      order.payment_status = 'paid';
      if (canAutoConfirmStatuses.includes(order.status)) {
        order.status = 'confirmed';
      }
      order.paid_at = new Date();
      changed = true;
    } else if (
      normalized === 'failed' ||
      normalized === 'error' ||
      normalized === 'cancelled'
    ) {
      order.payment_status = 'payment_failed';
      if (order.status === 'submitted' || order.status === 'payment_pending') {
        order.status = 'payment_failed';
      }
      changed = true;
    } else if (normalized === 'pending') {
      order.payment_status = 'pending';
      if (order.status === 'submitted') {
        order.status = 'payment_pending';
      }
      changed = true;
    }

    if (!changed) {
      return res.status(400).json({ message: 'Unsupported status' });
    }

    order.updated_at = new Date();
    // Optionally track last payment provider / transaction id in custom fields
    if (provider) order.payment_method = order.payment_method || provider;
    if (transaction_id) order.payment_txn_id = transaction_id; // not in schema, Mongoose will still store

    await order.save();

    const io = getIO();
    if (io) {
      io.to(`customer-${order.customer_id}`).emit('order:update', order);
      io.to(`restaurant-${order.restaurant_id}`).emit('order:update', order);
    }

    return res.json({ message: 'Payment status updated', order });
  } catch (e) {
    next(e);
  }
};

exports.listRestaurantOrders = async (req, res, next) => {
  try {
    const role = req.user.role;
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const {
      restaurant_id,
      status,
      page = 1,
      limit = 20,
    } = req.query;
    if (!restaurant_id) {
      return res
        .status(400)
        .json({ message: 'restaurant_id is required' });
    }

    const defaultStatuses = [
      'submitted',
      'payment_pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'delivering',
      'completed',
      'cancelled',
      'payment_failed',
    ];
    const statuses = (status
      ? String(status).split(',')
      : defaultStatuses
    )
      .map((s) => s.trim())
      .filter((s) => ORDER_STATUSES.includes(s));
    if (statuses.length === 0) {
      return res
        .status(400)
        .json({ message: 'No valid statuses provided' });
    }

    const q = {
      restaurant_id,
      status: { $in: statuses },
    };
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Order.find(q)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(q),
    ]);

    res.json({
      items,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (e) {
    next(e);
  }
};

