const Order = require('../models/Order');
const { recalcTotal } = require('../services/cartService');
const paymentClient = require('../clients/paymentClient');

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

// Place Order - Convert cart to pending order and initiate payment
exports.placeOrder = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { restaurant_id, long_address, payment_method } = req.body;

    if (!restaurant_id || !long_address || !payment_method) {
      return res.status(400).json({
        message: 'restaurant_id, long_address, and payment_method are required',
      });
    }

    // Find active cart
    const order = await Order.findOne({
      customer_id,
      restaurant_id,
      status: 'cart',
    });

    if (!order || order.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total
    recalcTotal(order);

    // Update order details
    order.long_address = long_address;
    order.payment_method = payment_method;
    order.status = 'payment_pending';
    order.payment_status = 'pending';
    order.submitted_at = new Date();
    order.updated_at = new Date();
    await order.save();

    // Generate payment URL if payment method is vnpay
    let paymentUrl = null;
    if (payment_method === 'vnpay') {
      try {
        const paymentResponse = await paymentClient.createVNPayPayment({
          orderId: order._id.toString(),
          amount: order.total_amount,
          orderInfo: `Thanh toan don hang ${order._id}`,
          returnUrl: `${process.env.FRONTEND_URL}/order/payment-result`,
        });
        paymentUrl = paymentResponse.paymentUrl;
      } catch (error) {
        console.error('Payment service error:', error);
        // Revert order status if payment creation fails
        order.status = 'cart';
        order.payment_status = 'unpaid';
        await order.save();
        return res.status(500).json({
          message: 'Failed to create payment. Please try again.',
        });
      }
    } else if (payment_method === 'cod') {
      // COD orders go directly to confirmed
      order.status = 'confirmed';
      order.payment_status = 'unpaid';
      await order.save();
    }

    res.json({
      success: true,
      order,
      paymentUrl,
      message: payment_method === 'cod' 
        ? 'Order placed successfully' 
        : 'Redirect to payment gateway',
    });
  } catch (e) {
    next(e);
  }
};

// Cancel Order - Cancel order before payment completion (A1 flow)
exports.cancelOrder = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { orderId } = req.params;
    const { cancellation_reason } = req.body;

    const order = await Order.findOne({ _id: orderId, customer_id });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow cancellation for orders in certain states
    const cancellableStatuses = ['cart', 'payment_pending', 'payment_failed'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Cannot cancel order with status: ${order.status}`,
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancellation_reason = cancellation_reason || 'Customer cancelled';
    order.cancelled_at = new Date();
    order.updated_at = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (e) {
    next(e);
  }
};

// Get Order Status - Track order status in real-time
exports.getOrderStatus = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne(
      { _id: orderId, customer_id },
      'status payment_status total_amount created_at submitted_at paid_at completed_at cancelled_at'
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      orderId: order._id,
      status: order.status,
      paymentStatus: order.payment_status,
      totalAmount: order.total_amount,
      timestamps: {
        created: order.created_at,
        submitted: order.submitted_at,
        paid: order.paid_at,
        completed: order.completed_at,
        cancelled: order.cancelled_at,
      },
    });
  } catch (e) {
    next(e);
  }
};

// Update order status after payment (called by payment service)
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { payment_status, transaction_id } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.payment_status = payment_status;

    if (payment_status === 'paid') {
      order.status = 'confirmed';
      order.paid_at = new Date();
    } else if (payment_status === 'failed') {
      order.status = 'payment_failed';
    }

    order.updated_at = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Payment status updated',
      order,
    });
  } catch (e) {
    next(e);
  }
};

