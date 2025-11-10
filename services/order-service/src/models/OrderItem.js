const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    order_item_id: { type: String, required: true, unique: true, index: true },
    order_id: { type: String, required: true, index: true },
    dish_id: { type: String, required: true },
    dish_name: { type: String, required: true },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
    dish_image_url: { type: String },
    category: { type: String },
    restaurant_id: { type: String, required: true }
  },
  { versionKey: false }
);

OrderItemSchema.index({ order_id: 1, dish_id: 1 });

module.exports = mongoose.model('OrderItem', OrderItemSchema);

