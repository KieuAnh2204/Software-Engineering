const mongoose = require('mongoose');

// Keep string IDs and snake_case to match existing DB patterns
const OrderSchema = new mongoose.Schema(
  {
    order_id: { type: String, required: true, unique: true, index: true },
    customer_id: { type: String, required: true, index: true },
    restaurant_id: { type: String, required: true, index: true },
    cart_id: { type: String },
    note: { type: String },
    total_amount: { type: Number, required: true, min: [0, 'Total cannot be negative'] },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Delivering', 'Completed', 'Cancelled'],
      default: 'Pending',
      index: true
    },
    created_at: { type: Date, default: Date.now, index: true },
    meta: {
      payment: {
        payment_id: { type: String },
        provider: { type: String },
        last_status: { type: String },
        checkout_url: { type: String },
        qr_data: { type: String },
        last_updated_at: { type: Date }
      },
      webhook: {
        last_signature: { type: String },
        last_payload_hash: { type: String }
      }
    }
  },
  { versionKey: false }
);

// Indexes per spec
OrderSchema.index({ customer_id: 1, created_at: -1 });
OrderSchema.index({ restaurant_id: 1, status: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ created_at: -1 });

module.exports = mongoose.model('Order', OrderSchema);
