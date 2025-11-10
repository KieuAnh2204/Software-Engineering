import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const customerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  username: { type: String, required: true, unique: true, trim: true },
  full_name: { type: String, required: true },
  phone: { type: String, required: true },
  customer_id: { type: String, unique: true, sparse: true },
  address: { type: String }
}, {
  timestamps: true,
  // Throw an error if a client tries to send unknown fields (e.g. legacy 'role')
  strict: 'throw'
});

// Indexes are inferred from unique fields; avoid duplicate explicit indexes

customerSchema.pre('save', async function(next) {
  // Generate customer_id if missing
  if (!this.customer_id) {
    const rand = crypto.randomBytes(4).toString('hex');
    this.customer_id = `CUST-${Date.now()}-${rand}`;
  }
  // Hash password if changed
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

customerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

customerSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('Customer', customerSchema);
