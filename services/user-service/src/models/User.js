import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['customer', 'restaurant', 'admin', 'BRAND_MANAGER'],
    default: 'customer'
  },
  fullName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  // Customer-specific fields
  customerProfile: {
    address: {
      street: String,
      ward: String,
      district: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    defaultAddress: String,
    favoriteRestaurants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    orderHistory: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }]
  },
  // Restaurant-specific fields
  restaurantProfile: {
    restaurantName: {
      type: String,
      trim: true
    },
    description: String,
    cuisineType: [{
      type: String,
      enum: ['Vietnamese', 'Chinese', 'Japanese', 'Korean', 'Thai', 'Western', 'FastFood', 'Dessert', 'Drinks', 'Other']
    }],
    address: {
      street: String,
      ward: String,
      district: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    openingHours: {
      monday: { open: String, close: String, isClosed: Boolean },
      tuesday: { open: String, close: String, isClosed: Boolean },
      wednesday: { open: String, close: String, isClosed: Boolean },
      thursday: { open: String, close: String, isClosed: Boolean },
      friday: { open: String, close: String, isClosed: Boolean },
      saturday: { open: String, close: String, isClosed: Boolean },
      sunday: { open: String, close: String, isClosed: Boolean }
    },
    images: [String],
    logo: String,
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 }
    },
    priceRange: {
      type: String,
      enum: ['$', '$$', '$$$', '$$$$']
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isAcceptingOrders: {
      type: Boolean,
      default: true
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    minOrderAmount: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON response
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
