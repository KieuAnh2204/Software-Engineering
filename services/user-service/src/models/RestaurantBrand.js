import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const restaurantBrandSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  username: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true },
  logo_url: { type: String },
  brand_id: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' }
}, {
  timestamps: true,
  strict: 'throw'
});

// Indexes are inferred from unique fields; avoid duplicate explicit indexes

restaurantBrandSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

restaurantBrandSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

restaurantBrandSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('RestaurantBrand', restaurantBrandSchema);
