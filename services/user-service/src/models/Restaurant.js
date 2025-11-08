import mongoose from 'mongoose';

/**
 * Restaurant Model - Đại diện cho chi nhánh của thương hiệu
 * Ví dụ: "Phở A - Q1", "Phở A - Q3"
 */
const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    maxlength: [100, 'Restaurant name cannot exceed 100 characters']
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantBrand',
    required: [true, 'Brand ID is required']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    ward: String,
    district: {
      type: String,
      required: [true, 'District is required']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      default: 'Ho Chi Minh'
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  openingHours: {
    monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, isClosed: { type: Boolean, default: false } }
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  deliveryRadius: {
    type: Number,
    default: 5, // km
    min: 0
  },
  minimumOrder: {
    type: Number,
    default: 0,
    min: 0
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
  collection: 'restaurants'
});

// Index để tìm kiếm nhanh
restaurantSchema.index({ brandId: 1 });
restaurantSchema.index({ 'address.city': 1, 'address.district': 1 });
restaurantSchema.index({ status: 1 });
restaurantSchema.index({ name: 'text' });

export default mongoose.model('Restaurant', restaurantSchema);
