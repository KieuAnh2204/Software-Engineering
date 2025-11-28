const axios = require("axios");

const baseURL = process.env.DRONE_SERVICE_URL || "http://localhost:3006/api";

const client = axios.create({ baseURL, timeout: 5000 });

async function assignPickup({ orderId, restaurant_location, customer_location }) {
  return client.post("/drone/assign", { orderId, restaurant_location, customer_location });
}

async function startDelivery({ orderId, customer_location }) {
  return client.post("/drone/start-delivery", { orderId, customer_location });
}

async function sendReturn({ orderId }) {
  return client.post("/drone/return", { orderId });
}

module.exports = {
  assignPickup,
  startDelivery,
  sendReturn,
};
