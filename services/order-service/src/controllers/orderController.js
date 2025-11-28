const Order = require("../models/Order");
const { getIO } = require("../socket");
const droneClient = require("../clients/droneClient");

const PAYMENT_SECRET_HEADER = "x-payment-signature";

const canAutoConfirmStatuses = [
  "submitted",
  "payment_pending",
  "payment_failed",
];

const ORDER_STATUSES = [
  "cart",
  "submitted",
  "payment_pending",
  "payment_failed",
  "confirmed",
  "preparing",
  "ready_for_delivery",
  "delivering",
  "arrived",
  "completed",
  "cancelled",
  "expired",
];

const broadcastOrder = (order) => {
  const io = getIO();
  if (!io) return;
  io.to(`customer-${order.customer_id}`).emit("order:update", order);
  io.to(`restaurant-${order.restaurant_id}`).emit("order:update", order);
};

exports.listOrders = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const defaultStatuses = [
      "submitted",
      "payment_pending",
      "confirmed",
      "preparing",
      "ready_for_delivery",
      "delivering",
      "arrived",
      "completed",
      "cancelled",
      "payment_failed",
    ];
    const statuses = (status ? String(status).split(",") : defaultStatuses)
      .map((s) => s.trim())
      .filter((s) => ORDER_STATUSES.includes(s));
    if (statuses.length === 0) {
      return res.status(400).json({ message: "No valid statuses provided" });
    }

    const q = { customer_id, status: { $in: statuses } };
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Order.find(q)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(q),
    ]);

    res.json({
      items,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (e) {
    next(e);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const role = req.user.role;
    const { orderId } = req.params;
    const query =
      role === "admin"
        ? { _id: orderId }
        : { _id: orderId, customer_id };
    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (e) {
    next(e);
  }
};

// Public read for drone/admin dashboards (no auth)
exports.getOrderPublic = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (e) {
    next(e);
  }
};

exports.mockMarkPaid = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (role !== "admin" && String(order.customer_id) !== String(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (order.payment_status === "paid") {
      return res.json({ order, alreadyPaid: true });
    }

    order.payment_status = "paid";
    order.status = "confirmed";
    order.paid_at = new Date();
    order.updated_at = new Date();
    await order.save();

    broadcastOrder(order);

    res.json({ order });
  } catch (e) {
    next(e);
  }
};

exports.paymentCallback = async (req, res, next) => {
  try {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({ message: "PAYMENT_WEBHOOK_SECRET not configured" });
    }
    const sig =
      req.headers[PAYMENT_SECRET_HEADER] ||
      req.headers[PAYMENT_SECRET_HEADER.toLowerCase()];
    if (sig !== secret) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const { orderId, status, transaction_id, provider } = req.body;
    if (!orderId || !status) {
      return res
        .status(400)
        .json({ message: "orderId and status are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const normalized = String(status).toLowerCase();
    let changed = false;

    if (normalized === "success" || normalized === "paid") {
      order.payment_status = "paid";
      order.status = "confirmed";
      order.paid_at = new Date();
      changed = true;
    } else if (
      normalized === "failed" ||
      normalized === "error" ||
      normalized === "cancelled"
    ) {
      order.payment_status = "payment_failed";
      if (order.status === "submitted" || order.status === "payment_pending") {
        order.status = "payment_failed";
      }
      changed = true;
    } else if (normalized === "pending") {
      order.payment_status = "pending";
      if (order.status === "submitted") {
        order.status = "payment_pending";
      }
      changed = true;
    }

    if (!changed) {
      return res.status(400).json({ message: "Unsupported status" });
    }

    order.updated_at = new Date();
    if (provider) order.payment_method = order.payment_method || provider;
    if (transaction_id) order.payment_txn_id = transaction_id;

    await order.save();

    broadcastOrder(order);

    return res.json({ message: "Payment status updated", order });
  } catch (e) {
    next(e);
  }
};

exports.listRestaurantOrders = async (req, res, next) => {
  try {
    const role = req.user.role;
    if (role !== "owner" && role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { restaurant_id, status, page = 1, limit = 20 } = req.query;
    if (!restaurant_id) {
      return res.status(400).json({ message: "restaurant_id is required" });
    }

    const defaultStatuses = [
      "submitted",
      "payment_pending",
      "confirmed",
      "preparing",
      "ready_for_delivery",
      "delivering",
      "arrived",
      "completed",
      "cancelled",
      "payment_failed",
    ];
    const statuses = (status ? String(status).split(",") : defaultStatuses)
      .map((s) => s.trim())
      .filter((s) => ORDER_STATUSES.includes(s));
    if (statuses.length === 0) {
      return res.status(400).json({ message: "No valid statuses provided" });
    }

    const q = {
      restaurant_id,
      status: { $in: statuses },
    };
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Order.find(q)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(q),
    ]);

    res.json({
      items,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (e) {
    next(e);
  }
};

exports.updateRestaurantStatus = async (req, res, next) => {
  try {
    const role = req.user.role;
    if (role !== "owner" && role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { orderId } = req.params;
    const { status, restaurant_id } = req.body;
    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }
    const allowedStatuses = [
      "preparing",
      "ready_for_delivery",
      "delivering",
      "completed",
      "cancelled",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (restaurant_id && String(order.restaurant_id) !== String(restaurant_id)) {
      return res.status(400).json({ message: "restaurant_id mismatch" });
    }

    order.status = status;
    order.updated_at = new Date();

    if (status === "preparing") {
      try {
        const drone = await droneClient.assignPickup({
          orderId: order._id,
          restaurant_location: order.restaurant_location,
          customer_location: order.delivery_location,
        });
        if (drone?.data?._id || drone?.data?.id) {
          order.assigned_drone = drone.data._id || drone.data.id;
        }
      } catch (err) {
        console.error("Failed to assign drone", err.message);
      }
    }

    if (status === "ready_for_delivery") {
      // Transition to delivering once drone starts flying to customer
      try {
        await droneClient.startDelivery({
          orderId: order._id,
          customer_location: order.delivery_location,
        });
        order.status = "delivering";
      } catch (err) {
        console.error("Failed to trigger drone delivery", err.message);
      }
    }

    if (status === "delivering" && order.assigned_drone) {
      try {
        await droneClient.startDelivery({
          orderId: order._id,
          customer_location: order.delivery_location,
        });
      } catch (err) {
        console.error("Failed to trigger drone delivery", err.message);
      }
    }

    if (status === "completed") {
      order.completed_at = new Date();
    }

    await order.save();

    broadcastOrder(order);

    res.json({ order });
  } catch (e) {
    next(e);
  }
};

exports.verifyPin = async (req, res, next) => {
  try {
    const orderId = req.params.id || req.params.orderId;
    const { pin } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const expected = order.pin_code;
    if (order.status !== "arrived") {
      return res.status(400).json({ message: "Drone not arrived yet" });
    }
    if (!pin || String(pin) !== String(expected)) {
      return res.status(400).json({ message: "Invalid PIN" });
    }

    order.status = "completed";
    order.arrival_confirmed = true;
    order.completed_at = new Date();
    order.updated_at = new Date();
    await order.save();

    try {
      await droneClient.sendReturn({ orderId: order._id });
    } catch (err) {
      console.error("Failed to send drone home", err.message);
    }

    broadcastOrder(order);
    res.json({ order });
  } catch (e) {
    next(e);
  }
};

exports.droneStatusUpdate = async (req, res, next) => {
  try {
    const secret = process.env.DRONE_SERVICE_SECRET;
    const sig = req.headers["x-drone-secret"];
    if (secret && sig !== secret) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { orderId } = req.params;
    const { status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ message: "orderId and status are required" });
    }
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.status = status;
    order.updated_at = new Date();
    if (status === "arrived") {
      order.arrival_confirmed = false;
    }
    await order.save();
    broadcastOrder(order);
    res.json({ order });
  } catch (e) {
    next(e);
  }
};
