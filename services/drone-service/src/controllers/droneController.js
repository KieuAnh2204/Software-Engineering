const Drone = require('../models/Drone');
const stateMachine = require('../services/droneStateMachine');

const HUB_STATION = {
  lat: Number(process.env.HUB_LAT || 10.8231),
  lng: Number(process.env.HUB_LNG || 106.6297),
};
const MOVEMENT_INTERVAL = Number(process.env.DRONE_TICK_MS || 1000);
const ARRIVAL_THRESHOLD = Number(process.env.DRONE_ARRIVAL_THRESHOLD || 0.0005);
const PATH_LIMIT = 200;
const TRAVEL_SECONDS = Number(process.env.DRONE_TRAVEL_SECONDS || 10);

const movementTimers = new Map();

const recordPosition = (drone) => {
  drone.path_history.push({
    lat: drone.current_location.lat,
    lng: drone.current_location.lng,
    timestamp: new Date(),
  });
  if (drone.path_history.length > PATH_LIMIT) {
    drone.path_history = drone.path_history.slice(-PATH_LIMIT);
  }
};

const clearExistingTimer = (droneId) => {
  const timer = movementTimers.get(droneId);
  if (timer) {
    clearInterval(timer);
    movementTimers.delete(droneId);
  }
};

const startMovement = (droneId, targetLocation, phase) => {
  clearExistingTimer(droneId);

  const timer = setInterval(async () => {
    try {
      const drone = await Drone.findById(droneId);
      if (!drone) {
        clearExistingTimer(droneId);
        return;
      }

      const currentLat = drone.current_location.lat;
      const currentLng = drone.current_location.lng;
      const targetLat = targetLocation.lat;
      const targetLng = targetLocation.lng;

      const distance = Math.sqrt(
        Math.pow(targetLat - currentLat, 2) + Math.pow(targetLng - currentLng, 2)
      );

      if (distance < ARRIVAL_THRESHOLD) {
        drone.current_location = { lat: targetLat, lng: targetLng };
        recordPosition(drone);

        if (phase === 'delivering') {
          drone.arrived_at_customer = true;
        }

        if (phase === 'returning') {
          drone.status = 'available';
          drone.assigned_order = null;
          drone.arrived_at_customer = false;
          drone.battery = Math.max(20, drone.battery - 10);
        }

        await drone.save();
        clearExistingTimer(droneId);
        return;
      }

      // Move so that we reach destination in ~TRAVEL_SECONDS
      const step = Math.min(
        0.9,
        Math.max(0.05, MOVEMENT_INTERVAL / (TRAVEL_SECONDS * 1000))
      );
      drone.current_location.lat += (targetLat - currentLat) * step;
      drone.current_location.lng += (targetLng - currentLng) * step;

      recordPosition(drone);
      await drone.save();
    } catch (error) {
      console.error('Error updating drone position:', error);
      clearExistingTimer(droneId);
    }
  }, MOVEMENT_INTERVAL);

  movementTimers.set(droneId, timer);
};

// GET /drone - Admin view
exports.getAllDrones = async (_req, res) => {
  try {
    const drones = await Drone.find().sort({ name: 1 });
    res.json({ success: true, count: drones.length, data: drones });
  } catch (error) {
    console.error('Error fetching drones:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /drone/available - Order-service consumes
exports.getAvailableDrones = async (_req, res) => {
  try {
    const drones = await Drone.find({
      status: 'available',
      battery: { $gte: 30 },
    }).sort({ battery: -1 });

    res.json({ success: true, count: drones.length, data: drones });
  } catch (error) {
    console.error('Error fetching available drones:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /drone/pickup
exports.assignPickup = async (req, res) => {
  try {
    const { order_id, restaurant_location } = req.body;
    if (!order_id || !restaurant_location?.lat || !restaurant_location?.lng) {
      return res
        .status(400)
        .json({ success: false, message: 'order_id and restaurant_location are required' });
    }

    const drone = await Drone.findOne({
      status: 'available',
      battery: { $gte: 30 },
    }).sort({ battery: -1 });

    if (!drone) {
      return res.status(404).json({ success: false, message: 'No available drones' });
    }

    if (!stateMachine.canTransition(drone.status, 'pickup')) {
      return res.status(400).json({ success: false, message: 'Drone cannot start pickup right now' });
    }

    drone.status = 'pickup';
    drone.assigned_order = order_id;
    drone.arrived_at_customer = false;
    recordPosition(drone);
    await drone.save();

    startMovement(drone._id.toString(), restaurant_location, 'pickup');

    res.json({
      success: true,
      message: 'Drone assigned to pickup',
      data: {
        drone_id: drone._id,
        drone_name: drone.name,
        status: drone.status,
        current_location: drone.current_location,
      },
    });
  } catch (error) {
    console.error('Error assigning pickup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /drone/deliver
exports.startDelivery = async (req, res) => {
  try {
    const { order_id, customer_location } = req.body;
    if (!order_id || !customer_location?.lat || !customer_location?.lng) {
      return res
        .status(400)
        .json({ success: false, message: 'order_id and customer_location are required' });
    }

    const drone = await Drone.findOne({ assigned_order: order_id });
    if (!drone) {
      return res.status(404).json({ success: false, message: 'No drone assigned to this order' });
    }

    if (!stateMachine.canTransition(drone.status, 'delivering')) {
      return res
        .status(400)
        .json({ success: false, message: `Drone cannot deliver from state ${drone.status}` });
    }

    drone.status = 'delivering';
    drone.arrived_at_customer = false;
    recordPosition(drone);
    await drone.save();

    startMovement(drone._id.toString(), customer_location, 'delivering');

    res.json({
      success: true,
      message: 'Drone started delivery',
      data: {
        drone_id: drone._id,
        drone_name: drone.name,
        status: drone.status,
        current_location: drone.current_location,
      },
    });
  } catch (error) {
    console.error('Error starting delivery:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /drone/return
exports.returnToStation = async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ success: false, message: 'order_id is required' });
    }

    const drone = await Drone.findOne({ assigned_order: order_id });
    if (!drone) {
      return res.status(404).json({ success: false, message: 'No drone assigned to this order' });
    }

    if (!stateMachine.canTransition(drone.status, 'returning')) {
      return res
        .status(400)
        .json({ success: false, message: `Drone cannot return from state ${drone.status}` });
    }

    drone.status = 'returning';
    drone.arrived_at_customer = false;
    recordPosition(drone);
    await drone.save();

    startMovement(drone._id.toString(), HUB_STATION, 'returning');

    res.json({
      success: true,
      message: 'Drone returning to station',
      data: {
        drone_id: drone._id,
        drone_name: drone.name,
        status: drone.status,
      },
    });
  } catch (error) {
    console.error('Error returning drone:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /drone/:id
exports.getDroneById = async (req, res) => {
  try {
    const drone = await Drone.findById(req.params.id);
    if (!drone) {
      return res.status(404).json({ success: false, message: 'Drone not found' });
    }
    res.json({ success: true, data: drone });
  } catch (error) {
    console.error('Error fetching drone:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /drone/order/:orderId
exports.getDroneByOrderId = async (req, res) => {
  try {
    const drone = await Drone.findOne({ assigned_order: req.params.orderId });
    if (!drone) {
      return res.status(404).json({ success: false, message: 'No drone assigned to this order' });
    }

    const distanceToHub = Math.sqrt(
      Math.pow(drone.current_location.lat - HUB_STATION.lat, 2) +
        Math.pow(drone.current_location.lng - HUB_STATION.lng, 2)
    );

    res.json({
      success: true,
      data: {
        ...drone.toObject(),
        eta_seconds: Math.max(5, Math.round((distanceToHub / ARRIVAL_THRESHOLD) * (MOVEMENT_INTERVAL / 1000))),
      },
    });
  } catch (error) {
    console.error('Error fetching drone by order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
