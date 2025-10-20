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
    enum: ['customer', 'restaurant', 'admin'],
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
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ 'restaurantProfile.cuisineType': 1 });
userSchema.index({ 'restaurantProfile.city': 1 });
userSchema.index({ 'restaurantProfile.isAcceptingOrders': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual to check if restaurant is currently open
userSchema.virtual('isOpenNow').get(function() {
  if (this.role !== 'restaurant' || !this.restaurantProfile?.openingHours) {
    return null;
  }

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  const hours = this.restaurantProfile.openingHours[today];

  if (!hours || hours.isClosed) {
    return false;
  }

  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime >= hours.open && currentTime <= hours.close;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const needsLock = this.loginAttempts + 1 >= 5;
  
  if (needsLock && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 }
  });
};

// Method to soft delete user
userSchema.methods.softDelete = async function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.isActive = false;
  return this.save();
};

// Method to restore deleted user
userSchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

// Static method to find active users
userSchema.statics.findActiveUsers = async function(role = null) {
  const query = { isActive: true, isDeleted: false };
  if (role) {
    query.role = role;
  }
  return this.find(query);
};

// Static method to find restaurants
userSchema.statics.findRestaurants = async function(filters = {}) {
  const query = {
    role: 'restaurant',
    isDeleted: false
  };
  
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  if (filters.isVerified !== undefined) {
    query['restaurantProfile.isVerified'] = filters.isVerified;
  }
  if (filters.cuisineType) {
    query['restaurantProfile.cuisineType'] = filters.cuisineType;
  }
  if (filters.city) {
    query['restaurantProfile.address.city'] = filters.city;
  }
  
  return this.find(query);
};

// Static method to get dashboard statistics
userSchema.statics.getDashboardStats = async function() {
  const stats = await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: ['$isActive', 1, 0] }
        }
      }
    }
  ]);
  
  return stats;
};

// Remove password from JSON response
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
