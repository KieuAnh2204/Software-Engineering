const mongoose = require('mongoose');

const DroneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'pickup', 'delivering', 'returning'],
      default: 'available',
      index: true,
    },
    current_location: {
      lat: { type: Number, default: 10.8231 }, // Default: HCM City
      lng: { type: Number, default: 106.6297 },
    },
    battery: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    assigned_order: {
      type: mongoose.Schema.Types.ObjectId, // Order ID from order-service
      default: null,
    },
    arrived_at_customer: {
      type: Boolean,
      default: false,
    },
    path_history: [
      {
        lat: Number,
        lng: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

DroneSchema.index({ status: 1, battery: -1 });

module.exports = mongoose.model('Drone', DroneSchema);
