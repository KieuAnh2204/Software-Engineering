const Order = require('../models/Order');

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

    res.json({ order });
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

