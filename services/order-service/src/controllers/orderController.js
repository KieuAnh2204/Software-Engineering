const Order = require('../models/Order');
const axios = require('axios');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, userId, restaurantId } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (restaurantId) query.restaurantId = restaurantId;

    const orders = await Order.find(query).sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    // Verify products exist (call Product Service)
    const productService = process.env.PRODUCT_SERVICE_URL;
    
    // Calculate total
    let totalAmount = 0;
    for (const item of req.body.items) {
      totalAmount += item.price * item.quantity;
    }
    
    req.body.totalAmount = totalAmount;
    
    // Estimate delivery time (30-45 minutes from now)
    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + 30);
    req.body.estimatedDeliveryTime = estimatedTime;
    
    const order = await Order.create(req.body);
    
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Restaurant Owner/Admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // If delivered, set deliveredAt timestamp
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      await order.save();
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Can only cancel if not delivered or out for delivery
    if (['delivered', 'out_for_delivery'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order in current status'
      });
    }
    
    order.status = 'cancelled';
    await order.save();
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/orders/user/:userId
// @access  Private
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant orders
// @route   GET /api/orders/restaurant/:restaurantId
// @access  Private (Restaurant Owner)
exports.getRestaurantOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ restaurantId: req.params.restaurantId })
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};
