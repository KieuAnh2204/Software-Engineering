const axios = require("axios");
const Drone = require("../models/Drone");

const STEP = Number(process.env.DRONE_STEP || 0.0006); // ~60-70m per tick
const STATION_LAT = Number(process.env.DRONE_STATION_LAT || 10.762622);
const STATION_LNG = Number(process.env.DRONE_STATION_LNG || 106.660172);
const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://localhost:3002/api/orders";
const DRONE_SECRET = process.env.DRONE_SERVICE_SECRET || "";

function distance(a, b) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

async function notifyArrival(orderId) {
  try {
    await axios.patch(
      `${ORDER_SERVICE_URL}/drones/${orderId}/status`,
      { status: "arrived" },
      {
        headers: DRONE_SECRET ? { "x-drone-secret": DRONE_SECRET } : {},
        timeout: 3000,
      }
    );
  } catch (err) {
    console.error("Failed to notify arrival", err.message);
  }
}

async function tick() {
  const moving = await Drone.find({
    status: { $in: ["pickup", "delivering", "returning"] },
  });

  for (const drone of moving) {
    if (drone.target_lat === null || drone.target_lng === null) continue;
    const cur = { lat: drone.current_lat, lng: drone.current_lng };
    const target = { lat: drone.target_lat, lng: drone.target_lng };
    const dist = distance(cur, target);
    if (dist < STEP) {
      drone.current_lat = target.lat;
      drone.current_lng = target.lng;
      drone.target_lat = null;
      drone.target_lng = null;

      if (drone.status === "delivering") {
        drone.status = "arrived";
        await drone.save();
        if (drone.current_order_id) {
          await notifyArrival(drone.current_order_id);
        }
        continue;
      }

      if (drone.status === "returning") {
        drone.status = "available";
        drone.current_order_id = null;
        await drone.save();
        continue;
      }

      // pickup arrival: stay at restaurant until start-delivery
      await drone.save();
      continue;
    }

    const ratio = STEP / dist;
    drone.current_lat = cur.lat + (target.lat - cur.lat) * ratio;
    drone.current_lng = cur.lng + (target.lng - cur.lng) * ratio;
    drone.battery = Math.max(0, drone.battery - 0.1);
    await drone.save();
  }
}

async function ensureSeed() {
  const count = await Drone.countDocuments();
  if (count === 0) {
    await Drone.create([
      {
        name: "Drone-A",
        current_lat: STATION_LAT,
        current_lng: STATION_LNG,
      },
      {
        name: "Drone-B",
        current_lat: STATION_LAT,
        current_lng: STATION_LNG,
      },
    ]);
    console.log("Seeded default drones");
  }
}

function startEngine() {
  setInterval(tick, 1000);
}

module.exports = { startEngine, ensureSeed, STATION_LAT, STATION_LNG };
