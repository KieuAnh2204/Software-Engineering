const Payment = require('../models/Payment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId, userId, amount, paymentMethod } = req.body;

    // Create payment record
    const payment = await Payment.create({
      orderId,
      userId,
      amount,
      paymentMethod,
      status: 'pending'
    });

    // For Stripe payments
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          paymentId: payment._id.toString(),
          orderId: orderId.toString()
        }
      });

      payment.stripePaymentId = paymentIntent.id;
      payment.status = 'processing';
      await payment.save();

      return res.status(201).json({
        success: true,
        data: payment,
        clientSecret: paymentIntent.client_secret
      });
    }

    // For cash/wallet payments
    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/:id/confirm
// @access  Private
exports.confirmPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify payment with Stripe if applicable
    if (payment.stripePaymentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        payment.stripePaymentId
      );

      if (paymentIntent.status !== 'succeeded') {
        payment.status = 'failed';
        payment.failureReason = 'Payment not completed';
        await payment.save();

        return res.status(400).json({
          success: false,
          message: 'Payment not completed'
        });
      }
    }

    payment.status = 'completed';
    await payment.save();

    // Update order payment status (call Order Service)
    try {
      await axios.put(
        `${process.env.ORDER_SERVICE_URL}/api/orders/${payment.orderId}/status`,
        { paymentStatus: 'completed' }
      );
    } catch (error) {
      console.error('Error updating order:', error.message);
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
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

// @desc    Refund payment
// @route   POST /api/payments/:id/refund
// @access  Private (Admin)
exports.refundPayment = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    // Process refund with Stripe if applicable
    if (payment.stripePaymentId) {
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentId,
        amount: amount ? Math.round(amount * 100) : undefined
      });

      payment.refundId = refund.id;
      payment.refundAmount = refund.amount / 100;
    } else {
      payment.refundAmount = amount || payment.amount;
    }

    payment.status = 'refunded';
    payment.refundReason = reason;
    await payment.save();

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
