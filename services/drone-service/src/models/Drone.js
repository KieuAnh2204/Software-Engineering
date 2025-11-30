const mongoose = require('mongoose');

const DroneSchema = new mongoose.Schema(
  {
    droneId: { type: String, required: true, unique: true, index: true },
    lat: { type: Number, required: true, default: 10.8231 },
    lng: { type: Number, required: true, default: 106.6297 },
    status: {
      type: String,
      enum: ['available', 'pickup', 'waiting_at_restaurant', 'delivering', 'returning'],
      default: 'available',
      index: true,
    },
    battery: { type: Number, default: 100, min: 0, max: 100 },
    station: { type: String, required: true, index: true },
    targetLat: { type: Number, default: null },
    targetLng: { type: Number, default: null },
    speed: { type: Number, default: 18 }, // meters / second

    // Assignment info
    orderId: { type: String, index: true },
    pinCode: { type: String },
    restaurantLat: { type: Number },
    restaurantLng: { type: Number },
    customerLat: { type: Number },
    customerLng: { type: Number },
    arrivedAtCustomer: { type: Boolean, default: false },
    unlocked: { type: Boolean, default: false },
    lastUpdate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

DroneSchema.index({ status: 1, battery: -1 });
DroneSchema.index({ orderId: 1 });

module.exports = mongoose.model('Drone', DroneSchema);
