const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  owner_id: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  logo_url: {
    type: String,
    default: null
  },
  open_time: {
    type: String,
    default: null
  },
  close_time: {
    type: String,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_blocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

restaurantSchema.index({ owner_id: 1, name: 1 }, { unique: false });

module.exports = mongoose.model('Restaurant', restaurantSchema);
