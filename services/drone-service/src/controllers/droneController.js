const Drone = require('../models/Drone');
const { distanceInMeters } = require('../utils/distance');

const HCM_CENTER = { lat: 10.7769, lng: 106.7009 };
const ARRIVAL_THRESHOLD_METERS = Number(process.env.DRONE_ARRIVAL_METERS || 35);
const MIN_BATTERY = Number(process.env.DRONE_MIN_BATTERY || 25);
const STATIONS = [
  { name: 'SaiGon-North', lat: 10.8231, lng: 106.6297 },
  { name: 'District-1', lat: 10.7769, lng: 106.7009 },
  { name: 'Thu-Duc', lat: 10.8702, lng: 106.8031 },
];

let tickRunning = false;

const findStation = (name) => STATIONS.find((s) => s.name === name) || STATIONS[0];
const clampBatteryDrain = (battery) => Math.max(5, Math.min(100, battery));

const selectNearestDrone = async (lat, lng) => {
  const candidates = await Drone.find({
    status: 'available',
    battery: { $gte: MIN_BATTERY },
  });

  if (!candidates.length) return null;

  let nearest = candidates[0];
  let minDistance = distanceInMeters(lat, lng, nearest.lat, nearest.lng);

  for (let i = 1; i < candidates.length; i++) {
    const d = candidates[i];
    const dist = distanceInMeters(lat, lng, d.lat, d.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = d;
    }
  }

  return nearest;
};

const getReturnTarget = (drone) => {
  const station = findStation(drone.station);
  return { lat: station.lat, lng: station.lng, station };
};

const moveTowardTarget = (drone) => {
  if (drone.targetLat == null || drone.targetLng == null) return drone;

  const distance = distanceInMeters(drone.lat, drone.lng, drone.targetLat, drone.targetLng);
  if (distance <= ARRIVAL_THRESHOLD_METERS) {
    drone.lat = drone.targetLat;
    drone.lng = drone.targetLng;
    return drone;
  }

  const stepMeters = (drone.speed || 18) * (Number(process.env.DRONE_TICK_MS || 1000) / 1000);
  const ratio = Math.min(1, stepMeters / distance);
  drone.lat = drone.lat + (drone.targetLat - drone.lat) * ratio;
  drone.lng = drone.lng + (drone.targetLng - drone.lng) * ratio;
  drone.battery = clampBatteryDrain(drone.battery - 0.05);
  drone.lastUpdate = new Date();

  return drone;
};

const handleArrival = (drone) => {
  if (drone.status === 'pickup') {
    drone.status = 'waiting_at_restaurant';
    drone.targetLat = null;
    drone.targetLng = null;
  } else if (drone.status === 'delivering') {
    drone.arrivedAtCustomer = true;
    drone.targetLat = null;
    drone.targetLng = null;
  } else if (drone.status === 'returning') {
    drone.status = 'available';
    drone.orderId = null;
    drone.pinCode = null;
    drone.arrivedAtCustomer = false;
    drone.unlocked = false;
    drone.restaurantLat = null;
    drone.restaurantLng = null;
    drone.customerLat = null;
    drone.customerLng = null;
    drone.targetLat = null;
    drone.targetLng = null;
  }
};

// Seed a few demo drones around Ho Chi Minh City
exports.seedDrones = async () => {
  const existing = await Drone.countDocuments();
  if (existing > 0) return;

  const seeds = [
    {
      droneId: 'DRN-001',
      station: STATIONS[0].name,
      lat: STATIONS[0].lat,
      lng: STATIONS[0].lng,
      status: 'available',
      speed: 18,
      battery: 100,
    },
    {
      droneId: 'DRN-002',
      station: STATIONS[1].name,
      lat: STATIONS[1].lat,
      lng: STATIONS[1].lng,
      status: 'available',
      speed: 16,
      battery: 92,
    },
    {
      droneId: 'DRN-003',
      station: STATIONS[2].name,
      lat: STATIONS[2].lat,
      lng: STATIONS[2].lng,
      status: 'available',
      speed: 20,
      battery: 88,
    },
  ];

  await Drone.insertMany(seeds);
  console.log(`Seeded ${seeds.length} drones`);
};

exports.simulateTick = async () => {
  if (tickRunning) return { skipped: true };
  tickRunning = true;
  try {
    const active = await Drone.find({
      status: { $in: ['pickup', 'delivering', 'returning'] },
    });

    for (const drone of active) {
      moveTowardTarget(drone);

      const distance = drone.targetLat == null || drone.targetLng == null
        ? 0
        : distanceInMeters(drone.lat, drone.lng, drone.targetLat, drone.targetLng);

      if (drone.targetLat != null && distance <= ARRIVAL_THRESHOLD_METERS) {
        handleArrival(drone);
      }

      await drone.save();
    }

    return { updated: active.length };
  } finally {
    tickRunning = false;
  }
};

exports.manualUpdate = async (_req, res) => {
  try {
    const result = await exports.simulateTick();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Manual update failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.findNearestDrone = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }

    const drone = await selectNearestDrone(lat, lng);
    if (!drone) {
      return res.status(404).json({ success: false, message: 'No available drones' });
    }

    const distance = distanceInMeters(lat, lng, drone.lat, drone.lng);
    res.json({
      success: true,
      data: {
        drone,
        distanceMeters: Math.round(distance),
      },
    });
  } catch (error) {
    console.error('Error finding nearest drone:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignDrone = async (req, res) => {
  try {
    const { orderId, restaurantLat, restaurantLng, customerLat, customerLng, pinCode } = req.body;
    if (!orderId || restaurantLat == null || restaurantLng == null) {
      return res.status(400).json({
        success: false,
        message: 'orderId, restaurantLat and restaurantLng are required',
      });
    }

    const drone = await selectNearestDrone(restaurantLat, restaurantLng);
    if (!drone) {
      return res.status(404).json({ success: false, message: 'No available drones' });
    }

    drone.status = 'pickup';
    drone.orderId = orderId;
    drone.restaurantLat = Number(restaurantLat);
    drone.restaurantLng = Number(restaurantLng);
    drone.customerLat = customerLat ?? HCM_CENTER.lat;
    drone.customerLng = customerLng ?? HCM_CENTER.lng;
    drone.pinCode = pinCode || '';
    drone.arrivedAtCustomer = false;
    drone.unlocked = false;
    drone.targetLat = drone.restaurantLat;
    drone.targetLng = drone.restaurantLng;
    drone.lastUpdate = new Date();

    await drone.save();

    res.json({
      success: true,
      message: 'Drone assigned and flying to restaurant',
      drone: {
        id: drone._id,
        droneId: drone.droneId,
        station: drone.station,
        status: drone.status,
        lat: drone.lat,
        lng: drone.lng,
        targetLat: drone.targetLat,
        targetLng: drone.targetLng,
      },
    });
  } catch (error) {
    console.error('Error assigning drone:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.startDelivery = async (req, res) => {
  try {
    const { orderId, customerLat, customerLng } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const drone = await Drone.findOne({ orderId });
    if (!drone) {
      return res.status(404).json({ success: false, message: 'No drone assigned to this order' });
    }

    if (drone.status !== 'waiting_at_restaurant' && drone.status !== 'pickup') {
      return res.status(400).json({
        success: false,
        message: `Drone cannot start delivery from status ${drone.status}`,
      });
    }

    const destinationLat = customerLat ?? drone.customerLat ?? HCM_CENTER.lat;
    const destinationLng = customerLng ?? drone.customerLng ?? HCM_CENTER.lng;

    drone.status = 'delivering';
    drone.arrivedAtCustomer = false;
    drone.targetLat = destinationLat;
    drone.targetLng = destinationLng;
    drone.customerLat = destinationLat;
    drone.customerLng = destinationLng;
    drone.lastUpdate = new Date();

    await drone.save();

    res.json({
      success: true,
      message: 'Drone en route to customer',
      drone: {
        id: drone._id,
        droneId: drone.droneId,
        status: drone.status,
        lat: drone.lat,
        lng: drone.lng,
        targetLat: drone.targetLat,
        targetLng: drone.targetLng,
      },
    });
  } catch (error) {
    console.error('Error starting delivery:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyPin = async (req, res) => {
  try {
    const { orderId, pin } = req.body;
    if (!orderId || !pin) {
      return res.status(400).json({ success: false, message: 'orderId and pin are required' });
    }

    const drone = await Drone.findOne({ orderId });
    if (!drone) {
      return res.status(404).json({ success: false, message: 'No drone assigned to this order' });
    }

    if (!drone.arrivedAtCustomer) {
      return res.status(400).json({ success: false, message: 'Drone has not arrived yet' });
    }

    if (String(drone.pinCode || '').padStart(4, '0') !== String(pin).padStart(4, '0')) {
      return res.status(400).json({ success: false, message: 'Invalid PIN' });
    }

    const { lat: homeLat, lng: homeLng, station } = getReturnTarget(drone);
    drone.status = 'returning';
    drone.targetLat = homeLat;
    drone.targetLng = homeLng;
    drone.arrivedAtCustomer = false;
    drone.unlocked = true;
    await drone.save();

    res.json({
      success: true,
      message: 'PIN verified. Drone returning to station.',
      drone: {
        id: drone._id,
        droneId: drone.droneId,
        station: station.name,
        status: drone.status,
        targetLat: drone.targetLat,
        targetLng: drone.targetLng,
      },
    });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDronePosition = async (req, res) => {
  try {
    const { orderId } = req.params;
    const drone = await Drone.findOne({ orderId });
    if (!drone) {
      return res.status(404).json({ success: false, message: 'No drone assigned to this order' });
    }

    res.json({
      success: true,
      data: {
        droneId: drone.droneId,
        lat: drone.lat,
        lng: drone.lng,
        status: drone.status,
        arrivedAtCustomer: drone.arrivedAtCustomer,
        battery: drone.battery,
        station: drone.station,
      },
    });
  } catch (error) {
    console.error('Error fetching position:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getArrivalStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const drone = await Drone.findOne({ orderId });
    if (!drone) {
      return res.status(404).json({ success: false, message: 'No drone assigned to this order' });
    }

    res.json({
      success: true,
      droneArrived: !!drone.arrivedAtCustomer,
      status: drone.status,
      droneId: drone.droneId,
    });
  } catch (error) {
    console.error('Error fetching arrival status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.listDrones = async (_req, res) => {
  try {
    const drones = await Drone.find().sort({ droneId: 1 });
    res.json({ success: true, count: drones.length, data: drones });
  } catch (error) {
    console.error('Error listing drones:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

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
