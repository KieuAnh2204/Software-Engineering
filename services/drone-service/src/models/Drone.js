const mongoose = require("mongoose");

const DroneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["available", "pickup", "delivering", "arrived", "returning"],
      default: "available",
      index: true,
    },
    current_lat: { type: Number, default: 0 },
    current_lng: { type: Number, default: 0 },
    target_lat: { type: Number, default: null },
    target_lng: { type: Number, default: null },
    battery: { type: Number, default: 100, min: 0, max: 100 },
    current_order_id: { type: String, default: null, index: true },
    restaurant_lat: { type: Number },
    restaurant_lng: { type: Number },
    customer_lat: { type: Number },
    customer_lng: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Drone", DroneSchema);
