import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  restaurant_id: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantBrand', required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CLOSED'], default: 'PENDING' }
}, {
  timestamps: true
});

restaurantSchema.index({ brand_id: 1 });

export default mongoose.model('Restaurant', restaurantSchema);
