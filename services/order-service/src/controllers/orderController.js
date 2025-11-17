const Order = require('../models/Order');

exports.listOrders = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const defaultStatuses = [
      'completed',
      'cancelled',
      'delivering',
      'preparing',
      'confirmed',
      'payment_failed',
    ];
    const statuses = status
      ? String(status).split(',')
      : defaultStatuses;

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

