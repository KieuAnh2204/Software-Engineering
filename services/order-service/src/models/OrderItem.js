const mongoose = require('mongoose');

const modifierSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  value: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Modifier price cannot be negative']
  }
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  clientItemId: {
    type: String,
    trim: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Product ID is required'],
    index: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Restaurant ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  image: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative']
  },
  modifiers: {
    type: [modifierSchema],
    default: []
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  preparationTime: {
    type: Number,
    min: [0, 'Preparation time cannot be negative']
  },
  itemTotal: {
    type: Number,
    required: [true, 'Item total is required'],
    min: [0, 'Item total cannot be negative']
  }
}, {
  _id: false
});

module.exports = {
  orderItemSchema,
  modifierSchema
};
