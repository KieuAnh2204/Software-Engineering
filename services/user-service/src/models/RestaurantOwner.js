import mongoose from 'mongoose';

const restaurantOwnerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  display_name: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  logo_url: { type: String, default: null },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
    default: 'PENDING'
  },
  owner_id: { type: String, unique: true, sparse: true }
}, {
  timestamps: true
});

restaurantOwnerSchema.pre('save', function ensureOwnerId(next) {
  if (!this.owner_id) {
    this.owner_id = `OWNER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

export default mongoose.model('RestaurantOwner', restaurantOwnerSchema);
