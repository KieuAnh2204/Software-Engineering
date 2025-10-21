import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Restaurant ID is required'],
    index: true
  },
  // Legacy field - kept for backward compatibility
  image: {
    type: String,
    trim: true
  },
  available: {
    type: Boolean,
    default: true,
    index: true
  },
  preparationTime: {
    type: Number,
    default: 15,
    min: [0, 'Preparation time cannot be negative'],
    max: [180, 'Preparation time cannot exceed 180 minutes']
  },
  spicyLevel: {
    type: Number,
    min: [0, 'Spicy level must be between 0 and 5'],
    max: [5, 'Spicy level must be between 0 and 5'],
    default: 0
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  allergens: [{
    type: String,
    enum: ['Peanuts', 'Tree nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame']
  }],
  nutritionInfo: {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 }
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
productSchema.index({ restaurantId: 1, categoryId: 1 });
productSchema.index({ restaurantId: 1, available: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ available: 1 });
productSchema.index({ isDeleted: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for checking low calorie
productSchema.virtual('isLowCalorie').get(function() {
  return this.nutritionInfo?.calories && this.nutritionInfo.calories < 300;
});

// Virtual for formatted price (VND)
productSchema.virtual('formattedPrice').get(function() {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(this.price);
});

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
});

// Virtual to populate images
productSchema.virtual('images', {
  ref: 'Image',
  localField: '_id',
  foreignField: 'productId'
});

// Virtual to populate category
productSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true
});

// Static method to find available products by restaurant
productSchema.statics.findAvailableByRestaurant = async function(restaurantId) {
  return this.find({ 
    restaurantId, 
    available: true,
    isDeleted: false 
  })
  .populate('categoryId', 'name')
  .populate('images')
  .sort({ name: 1 });
};

// Static method for advanced product search
productSchema.statics.searchProducts = async function(query, filters = {}) {
  const searchQuery = {
    isDeleted: false
  };

  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }

  // Filters
  if (filters.restaurantId) {
    searchQuery.restaurantId = filters.restaurantId;
  }
  if (filters.categoryId) {
    searchQuery.categoryId = filters.categoryId;
  }
  if (filters.minPrice !== undefined) {
    searchQuery.price = { ...searchQuery.price, $gte: filters.minPrice };
  }
  if (filters.maxPrice !== undefined) {
    searchQuery.price = { ...searchQuery.price, $lte: filters.maxPrice };
  }
  if (filters.spicyLevel !== undefined) {
    searchQuery.spicyLevel = filters.spicyLevel;
  }
  if (filters.availableOnly) {
    searchQuery.available = true;
  }

  return this.find(searchQuery)
    .populate('categoryId', 'name image')
    .populate('images')
    .sort({ name: 1 });
};

// Instance method to soft delete
productSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.available = false;
  return this.save();
};

// Instance method to restore
productSchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

// Pre-save hook to update category product count
productSchema.pre('save', async function(next) {
  if (this.isNew && this.categoryId) {
    const Category = mongoose.model('Category');
    await Category.incrementProductCount(this.categoryId);
  }
  next();
});

// Pre-remove hook to update category product count
productSchema.pre('remove', async function(next) {
  if (this.categoryId) {
    const Category = mongoose.model('Category');
    await Category.decrementProductCount(this.categoryId);
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
