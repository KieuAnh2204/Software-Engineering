const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // VND at snapshot
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
    notes: { type: String },
  },
  { _id: true }
);

const OrderSchema = new mongoose.Schema(
  {
    customer_id: { type: String, required: true, index: true },
    restaurant_id: { type: String, required: true, index: true },

    status: {
      type: String,
      enum: [
        'cart',
        'submitted',
        'payment_pending',
        'payment_failed',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'ready_for_delivery',
        'delivering',
        'arrived',
        'completed',
        'cancelled',
        'expired',
      ],
      default: 'cart',
      index: true,
    },

    payment_status: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'refunded'],
      default: 'unpaid',
    },

    payment_method: {
      type: String,
      enum: ['cod', 'vnpay', 'momo', 'card'],
    },

    items: { type: [OrderItemSchema], default: [] },

    // Money: single field (VND integer)
    total_amount: { type: Number, default: 0, min: 0 },

    // Address as a single string
    long_address: { type: String },

    // Optional delivery instruction / note
    delivery_instruction: { type: String },

    // Phone number for delivery verification
    phone_number: { type: String },
    
    // PIN code (last 4 digits of phone number)
    pin_code: { type: String },

    // Drone assignment
    assigned_drone_id: { type: String },

    // Explicit timestamps
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },

    submitted_at: Date,
    paid_at: Date,
    completed_at: Date,
    cancelled_at: Date,
    expires_at: Date,

    cancellation_reason: String,
  },
  { timestamps: false }
);

OrderSchema.index({ customer_id: 1, restaurant_id: 1, status: 1 });

module.exports = mongoose.model('Order', OrderSchema);

