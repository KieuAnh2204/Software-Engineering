const Drone = require("../models/Drone");
const { STATION_LAT, STATION_LNG } = require("../services/droneEngine");

exports.list = async (req, res, next) => {
  try {
    const drones = await Drone.find().sort({ name: 1 });
    res.json(drones);
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const drone = await Drone.findById(id);
    if (!drone) return res.status(404).json({ message: "Drone not found" });
    res.json(drone);
  } catch (e) {
    next(e);
  }
};

exports.positionByOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const drone = await Drone.findOne({ current_order_id: orderId });
    if (!drone) return res.status(404).json({ message: "No drone for this order" });
    res.json({
      drone_id: drone._id,
      status: drone.status,
      lat: drone.current_lat,
      lng: drone.current_lng,
      order_id: drone.current_order_id,
    });
  } catch (e) {
    next(e);
  }
};

exports.assign = async (req, res, next) => {
  try {
    const { orderId, restaurant_location } = req.body;
    if (!orderId || !restaurant_location?.lat || !restaurant_location?.lng) {
      return res.status(400).json({ message: "orderId and restaurant_location are required" });
    }

    const drone = await Drone.findOne({ status: "available" }).sort({ battery: -1, updatedAt: 1 });
    if (!drone) return res.status(404).json({ message: "No available drone" });

    drone.current_order_id = orderId;
    drone.status = "pickup";
    drone.restaurant_lat = restaurant_location.lat;
    drone.restaurant_lng = restaurant_location.lng;
    drone.target_lat = restaurant_location.lat;
    drone.target_lng = restaurant_location.lng;
    if (!drone.current_lat && !drone.current_lng) {
      drone.current_lat = STATION_LAT;
      drone.current_lng = STATION_LNG;
    }
    await drone.save();
    res.json(drone);
  } catch (e) {
    next(e);
  }
};

exports.startDelivery = async (req, res, next) => {
  try {
    const { orderId, customer_location } = req.body;
    if (!orderId || !customer_location?.lat || !customer_location?.lng) {
      return res.status(400).json({ message: "orderId and customer_location are required" });
    }
    const drone = await Drone.findOne({ current_order_id: orderId });
    if (!drone) return res.status(404).json({ message: "Drone not found for order" });
    drone.status = "delivering";
    drone.customer_lat = customer_location.lat;
    drone.customer_lng = customer_location.lng;
    drone.target_lat = customer_location.lat;
    drone.target_lng = customer_location.lng;
    await drone.save();
    res.json(drone);
  } catch (e) {
    next(e);
  }
};

exports.returnHome = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "orderId is required" });
    const drone = await Drone.findOne({ current_order_id: orderId });
    if (!drone) return res.status(404).json({ message: "Drone not found for order" });
    drone.status = "returning";
    drone.target_lat = STATION_LAT;
    drone.target_lng = STATION_LNG;
    await drone.save();
    res.json(drone);
  } catch (e) {
    next(e);
  }
};
