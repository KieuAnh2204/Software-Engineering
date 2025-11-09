const mongoose = require('mongoose');
const { orderItemSchema } = require('./OrderItem');
const { ORDER_STATUSES, TRACKING_STEPS } = require('../constants/orderStatus');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true, trim: true },
  ward: { type: String, trim: true },
  district: { type: String, trim: true },
  city: { type: String, trim: true },
  country: { type: String, trim: true, default: 'Vietnam' },
  contactName: { type: String, trim: true },
  phone: { type: String, required: true, trim: true },
  instructions: { type: String, trim: true, maxlength: 500 }
}, { _id: false });

const totalsSchema = new mongoose.Schema({
  subtotal: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  deliveryFee: { type: Number, default: 0, min: 0 },
  serviceFee: { type: Number, default: 0, min: 0 },
  tip: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cod', 'card', 'wallet', 'bank_transfer'],
    default: 'cod'
  },
  status: {
    type: String,
    enum: ['pending', 'authorized', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: { type: String, trim: true },
  provider: { type: String, trim: true },
  amount: { type: Number, min: 0 },
  paidAt: { type: Date }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ORDER_STATUSES,
    required: true
  },
  note: {
    type: String,
    maxlength: 300,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const trackingEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ORDER_STATUSES,
    required: true
  },
  description: {
    type: String,
    maxlength: 300,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const trackingSchema = new mongoose.Schema({
  currentStep: {
    type: String,
    enum: TRACKING_STEPS,
    default: 'order_received'
  },
  etaMinutes: {
    type: Number,
    min: 0,
    default: 45
  },
  events: {
    type: [trackingEventSchema],
    default: []
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart'
  },
  items: {
    type: [orderItemSchema],
    validate: [
      {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Order must contain at least one item'
      }
    ]
  },
  totals: {
    type: totalsSchema,
    default: () => ({})
  },
  deliveryAddress: {
    type: addressSchema,
    required: true
  },
  payment: {
    type: paymentSchema,
    default: () => ({})
  },
  status: {
    type: String,
    enum: ORDER_STATUSES,
    default: 'pending',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'authorized', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  estimatedDeliveryTime: {
    type: Date
  },
  scheduledFor: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  statusHistory: {
    type: [statusHistorySchema],
    default: []
  },
  tracking: {
    type: trackingSchema,
    default: () => ({})
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  specialInstructions: {
    type: String,
    maxlength: 500,
    trim: true
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

orderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
orderSchema.index({ code: 1 });

orderSchema.pre('save', function(next) {
  if (!this.code) {
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.code = `ORD-${Date.now()}-${random}`;
  }

  if (!this.statusHistory.length) {
    this.statusHistory.push({
      status: this.status,
      note: 'Order created',
      updatedAt: new Date()
    });
  }

  if (!this.tracking.events.length) {
    this.tracking.events.push({
      status: 'pending',
      description: 'Order received',
      createdAt: new Date()
    });
  }

  next();
});

orderSchema.methods.addStatusHistory = function(status, note, updatedBy) {
  this.statusHistory.push({
    status,
    note,
    updatedBy,
    updatedAt: new Date()
  });

  if (!this.tracking) {
    this.tracking = {};
  }

  if (!Array.isArray(this.tracking.events)) {
    this.tracking.events = [];
  }

  this.tracking.currentStep = status;
  this.tracking.events.push({
    status,
    description: note,
    createdAt: new Date()
  });
};

orderSchema.statics.VALID_STATUSES = ORDER_STATUSES;

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
