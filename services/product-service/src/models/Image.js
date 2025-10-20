import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true
  },
  url: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true
  },
  publicId: {
    type: String,
    trim: true,
    // For cloud storage (Cloudinary, S3) - stores the file ID for deletion
  },
  alt: {
    type: String,
    trim: true,
    maxlength: [200, 'Alt text cannot exceed 200 characters']
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  size: {
    type: Number,
    // Size in bytes
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  },
  format: {
    type: String,
    enum: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    lowercase: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
imageSchema.index({ productId: 1, isPrimary: -1 });
imageSchema.index({ productId: 1, displayOrder: 1 });
imageSchema.index({ createdAt: -1 });

// Virtual to check if image is landscape
imageSchema.virtual('isLandscape').get(function() {
  if (this.width && this.height) {
    return this.width > this.height;
  }
  return null;
});

// Virtual to get formatted size
imageSchema.virtual('formattedSize').get(function() {
  if (!this.size) return null;
  
  const kb = this.size / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
});

// Static method to get product images
imageSchema.statics.getProductImages = async function(productId, primaryOnly = false) {
  const query = { productId };
  if (primaryOnly) {
    query.isPrimary = true;
  }
  return this.find(query).sort({ isPrimary: -1, displayOrder: 1 });
};

// Static method to get primary image
imageSchema.statics.getPrimaryImage = async function(productId) {
  return this.findOne({ productId, isPrimary: true });
};

// Static method to set primary image
imageSchema.statics.setPrimaryImage = async function(imageId, productId) {
  // First, unset all primary images for this product
  await this.updateMany(
    { productId, isPrimary: true },
    { $set: { isPrimary: false } }
  );
  
  // Then set the new primary image
  return this.findByIdAndUpdate(
    imageId,
    { $set: { isPrimary: true } },
    { new: true }
  );
};

// Static method to delete product images
imageSchema.statics.deleteProductImages = async function(productId) {
  return this.deleteMany({ productId });
};

// Instance method to update image URL
imageSchema.methods.updateUrl = async function(newUrl, publicId = null) {
  this.url = newUrl;
  if (publicId) {
    this.publicId = publicId;
  }
  return this.save();
};

const Image = mongoose.model('Image', imageSchema);

export default Image;
