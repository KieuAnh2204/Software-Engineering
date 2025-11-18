import mongoose from 'mongoose';
import crypto from 'crypto';

const customerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  full_name: { type: String, required: true },
  phone: { type: String, required: true },
  customer_id: { type: String, unique: true, sparse: true },
  address: { type: String, default: '' }
}, {
  timestamps: true
});

customerSchema.pre('save', function generateCustomerId(next) {
  if (!this.customer_id) {
    const rand = crypto.randomBytes(4).toString('hex');
    this.customer_id = `CUST-${Date.now()}-${rand}`;
  }
  next();
});

export default mongoose.model('Customer', customerSchema);
