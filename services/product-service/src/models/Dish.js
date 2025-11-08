const mongoose = require('mongoose');

/**
 * Dish Model - Món ăn cụ thể
 * Ví dụ: "Phở Tái", "Phở Gà", "Cơm Tấm Sườn"
 */
const dishSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Dish name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    default: null
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category ID is required'],
    index: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Restaurant ID is required'],
    index: true
  },
  images: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    default: 15, // phút
    min: [0, 'Preparation time cannot be negative']
  },
  unit: {
    type: String,
    default: 'portion', // 'portion', 'bowl', 'plate', 'cup', etc.
    trim: true
  },
  // Thông tin dinh dưỡng (optional)
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  // Tags cho tìm kiếm
  tags: [{
    type: String,
    trim: true
  }],
  // Đánh giá
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  // Số lượng đã bán
  soldCount: {
    type: Number,
    default: 0,
    min: 0
  },
  displayOrder: {
    type: Number,
    default: 0
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
  collection: 'dishes'
});

// Index để tìm kiếm nhanh
dishSchema.index({ restaurantId: 1, categoryId: 1 });
dishSchema.index({ restaurantId: 1, isAvailable: 1 });
dishSchema.index({ name: 'text', description: 'text', tags: 'text' });
dishSchema.index({ soldCount: -1 }); // Sắp xếp món bán chạy

module.exports = mongoose.model('Dish', dishSchema);
