import mongoose from 'mongoose';

/**
 * RestaurantBrand Model - Đại diện cho thương hiệu nhà hàng
 * Ví dụ: "Phở A", "Highland Coffee", "KFC Vietnam"
 */
const restaurantBrandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  logo: {
    type: String,
    default: null
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required']
  },
  ownerEmail: {
    type: String,
    required: true
  },
  ownerName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
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
  collection: 'restaurant_brands'
});

// Index để tìm kiếm nhanh
restaurantBrandSchema.index({ ownerId: 1 });
restaurantBrandSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('RestaurantBrand', restaurantBrandSchema);
