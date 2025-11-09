const mongoose = require('mongoose');
const { orderItemSchema } = require('./OrderItem');

const cartItemSchema = orderItemSchema.clone();
cartItemSchema.add({
  isSavedForLater: {
    type: Boolean,
    default: false
  },
  isSelected: {
    type: Boolean,
    default: true
  }
});

const pricingSchema = new mongoose.Schema({
  subtotal: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  deliveryFee: { type: Number, default: 0, min: 0 },
  serviceFee: { type: Number, default: 0, min: 0 },
  tip: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 }
}, { _id: false });

const cartSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['active', 'checked_out', 'abandoned'],
    default: 'active',
    index: true
  },
  items: {
    type: [cartItemSchema],
    default: []
  },
  pricing: {
    type: pricingSchema,
    default: () => ({})
  },
  notes: {
    type: String,
    maxlength: [500, 'Cart notes cannot exceed 500 characters']
  },
  expiresAt: {
    type: Date
  },
  lastSyncedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

cartSchema.index({ userId: 1, restaurantId: 1, status: 1 });

module.exports = mongoose.model('Cart', cartSchema);
