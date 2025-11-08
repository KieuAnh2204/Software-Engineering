const mongoose = require('mongoose');

/**
 * Category Model - Danh mục món ăn
 * Ví dụ: "Phở", "Bún", "Cơm", "Nước uống"
 */
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Restaurant ID is required'],
    index: true
  },
  image: {
    type: String,
    default: null
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'categories'
});

// Index để tìm kiếm nhanh theo nhà hàng
categorySchema.index({ restaurantId: 1, displayOrder: 1 });
categorySchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Category', categorySchema);
