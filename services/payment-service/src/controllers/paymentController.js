const Payment = require('../models/Payment');

// Stripe is not used in this project (VNPAY only). Legacy endpoints return 501.
exports.createPaymentIntent = async (_req, res) => {
  return res
    .status(501)
    .json({ success: false, message: 'Stripe/intent flow is not supported. Use VNPAY.' });
};

exports.confirmPayment = async (_req, res) => {
  return res
    .status(501)
    .json({ success: false, message: 'Stripe confirm is not supported. Use VNPAY.' });
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment by order ID
// @route   GET /api/payments/order/:orderId
// @access  Private
exports.getPaymentByOrder = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found for this order'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user payments
// @route   GET /api/payments/user/:userId
// @access  Private
exports.getUserPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.params.userId })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};
