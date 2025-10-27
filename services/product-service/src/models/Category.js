import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  productCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ displayOrder: 1 });

// Virtual to check if category has products
categorySchema.virtual('hasProducts').get(function() {
  return this.productCount > 0;
});

// Static method to get active categories
categorySchema.statics.getActiveCategories = async function() {
  return this.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 });
};

// Static method to increment product count
categorySchema.statics.incrementProductCount = async function(categoryId) {
  return this.findByIdAndUpdate(
    categoryId,
    { $inc: { productCount: 1 } },
    { new: true }
  );
};

// Static method to decrement product count
categorySchema.statics.decrementProductCount = async function(categoryId) {
  return this.findByIdAndUpdate(
    categoryId,
    { $inc: { productCount: -1 } },
    { new: true }
  );
};

// Instance method to toggle active status
categorySchema.methods.toggleActive = async function() {
  this.isActive = !this.isActive;
  return this.save();
};

const Category = mongoose.model('Category', categorySchema);

export default Category;
