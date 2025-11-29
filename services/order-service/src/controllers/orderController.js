const Order = require('../models/Order');
const { getIO } = require('../socket');
const axios = require('axios');
const { recalcTotal } = require('../services/cartService');

const DRONE_SERVICE_URL = process.env.DRONE_SERVICE_URL || 'http://drone-service:3006/api/drones';
const DRONES_DISABLED = process.env.DISABLE_DRONES === 'true';
const DEFAULT_RESTAURANT_LOCATION = {
  lat: Number(process.env.DEFAULT_RESTAURANT_LAT || 10.7769),
  lng: Number(process.env.DEFAULT_RESTAURANT_LNG || 106.7009),
};
const DEFAULT_CUSTOMER_LOCATION = {
  lat: Number(process.env.DEFAULT_CUSTOMER_LAT || 10.8231),
  lng: Number(process.env.DEFAULT_CUSTOMER_LNG || 106.6297),
};

const assignDroneForOrder = async (orderId, restaurantLocation, customerLocation, pinCode) => {
  if (DRONES_DISABLED) return { disabled: true };
  const payload = {
    orderId,
    restaurantLat: restaurantLocation.lat,
    restaurantLng: restaurantLocation.lng,
    customerLat: customerLocation.lat,
    customerLng: customerLocation.lng,
    pinCode,
  };
  return axios.post(`${DRONE_SERVICE_URL}/assign`, payload);
};

const startDroneDelivery = async (orderId, customerLocation) => {
  if (DRONES_DISABLED) return { disabled: true };
  const payload = {
    orderId,
    customerLat: customerLocation.lat,
    customerLng: customerLocation.lng,
  };
  return axios.post(`${DRONE_SERVICE_URL}/start-delivery`, payload);
};

const fetchDroneArrival = async (orderId) => {
  if (DRONES_DISABLED) return { disabled: true };
  return axios.get(`${DRONE_SERVICE_URL}/arrival-status/${orderId}`);
};

const verifyWithDroneService = async (orderId, pin) => {
  if (DRONES_DISABLED) return { disabled: true };
  return axios.post(`${DRONE_SERVICE_URL}/verify-pin`, { orderId, pin });
};

const PAYMENT_SECRET_HEADER = 'x-payment-signature';

const canAutoConfirmStatuses = [
  'submitted',
  'payment_pending',
  'payment_failed',
];

const ORDER_STATUSES = [
  'cart',
  'submitted',
  'payment_pending',
  'payment_failed',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'ready_for_delivery',
  'delivering',
  'arrived',
  'completed',
  'cancelled',
  'expired',
];

// Create order directly (alternative to cart checkout)
exports.createOrder = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const {
      restaurant_id,
      items = [],
      address,
      instruction,
      payment_method,
      phone_number,
    } = req.body;

    if (!restaurant_id) {
      return res.status(400).json({ message: 'restaurant_id is required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items are required' });
    }
    if (!payment_method) {
      return res.status(400).json({ message: 'payment_method is required' });
    }
    const paymentMethods = ['cod', 'vnpay', 'momo', 'card'];
    if (!paymentMethods.includes(payment_method)) {
      return res.status(400).json({ message: 'payment_method is invalid' });
    }
    if (!phone_number || typeof phone_number !== 'string') {
      return res.status(400).json({ message: 'phone_number is required for verification' });
    }
    if (address !== undefined && typeof address !== 'string') {
      return res.status(400).json({ message: 'address must be a string' });
    }
    if (instruction !== undefined && typeof instruction !== 'string') {
      return res.status(400).json({ message: 'instruction must be a string' });
    }

    const order = new Order({
      customer_id,
      restaurant_id,
      items: items.map((it) => ({
        productId: it.productId,
        name: it.name,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        image: it.image,
        notes: it.notes,
      })),
      long_address: address,
      delivery_instruction: instruction,
      payment_method,
      status: payment_method === 'vnpay' ? 'payment_pending' : 'submitted',
      payment_status: payment_method === 'cod' ? 'unpaid' : 'pending',
      created_at: new Date(),
      updated_at: new Date(),
      submitted_at: new Date(),
    });

    recalcTotal(order);
    const cleanPhone = phone_number.replace(/\D/g, '');
    order.phone_number = phone_number;
    order.pin_code = cleanPhone.slice(-4).padStart(4, '0');

    await order.save();

    // Auto-create & assign a fresh drone for this order immediately to avoid shared drone conflicts
    // Uses default restaurant & customer fallback coordinates; extend later with real locations per restaurant/customer.
    try {
      const droneRes = await assignDroneForOrder(
        order._id.toString(),
        DEFAULT_RESTAURANT_LOCATION,
        DEFAULT_CUSTOMER_LOCATION,
        order.pin_code
      );
      if (droneRes?.data?.success) {
        order.drone_assigned_at = new Date();
      }
    } catch (droneErr) {
      // Do not fail order creation if drone assignment fails; front-end can retry.
      console.error('Drone assignment failed for order', order._id.toString(), droneErr.message);
    }

    const io = getIO();
    if (io) {
      io.to(`customer-${order.customer_id}`).emit('order:update', order);
      io.to(`restaurant-${order.restaurant_id}`).emit('order:update', order);
    }

    res.status(201).json({ order });
  } catch (e) {
    next(e);
  }
};

exports.listOrders = async (req, res, next) => {
  try {
    const customer_id = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const defaultStatuses = [
      'submitted',
      'payment_pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'ready_for_delivery',
      'delivering',
      'completed',
      'cancelled',
      'payment_failed',
    ];
    const statuses = (status
      ? String(status).split(',')
      : defaultStatuses
    )
      .map((s) => s.trim())
      .filter((s) => ORDER_STATUSES.includes(s));
    if (statuses.length === 0) {
      return res
        .status(400)
        .json({ message: 'No valid statuses provided' });
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
    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId, customer_id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
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
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only the owning customer or an admin can mark paid
    if (role !== 'admin' && String(order.customer_id) !== String(userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // If already paid, just return current state
    if (order.payment_status === 'paid') {
      return res.json({ order, alreadyPaid: true });
    }

    order.payment_status = 'paid';
    if (
      order.status === 'submitted' ||
      order.status === 'payment_pending' ||
      order.status === 'payment_failed' ||
      order.status === 'confirmed'
    ) {
      order.status = 'preparing';
    }
    order.paid_at = new Date();
    order.updated_at = new Date();
    await order.save();

    // Broadcast payment/status change
    const io = getIO();
    if (io) {
      io.to(`customer-${order.customer_id}`).emit('order:update', order);
      io.to(`restaurant-${order.restaurant_id}`).emit('order:update', order);
    }

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
        .json({ message: 'PAYMENT_WEBHOOK_SECRET not configured' });
    }
    const sig =
      req.headers[PAYMENT_SECRET_HEADER] ||
      req.headers[PAYMENT_SECRET_HEADER.toLowerCase()];
    if (sig !== secret) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const { orderId, status, transaction_id, provider } = req.body;
    if (!orderId || !status) {
      return res
        .status(400)
        .json({ message: 'orderId and status are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const normalized = String(status).toLowerCase();
    let changed = false;

    if (normalized === 'success' || normalized === 'paid') {
      order.payment_status = 'paid';
      if (
        canAutoConfirmStatuses.includes(order.status) ||
        order.status === 'confirmed'
      ) {
        order.status = 'preparing';
      }
      order.paid_at = new Date();
      changed = true;
    } else if (
      normalized === 'failed' ||
      normalized === 'error' ||
      normalized === 'cancelled'
    ) {
      order.payment_status = 'payment_failed';
      if (order.status === 'submitted' || order.status === 'payment_pending') {
        order.status = 'payment_failed';
      }
      changed = true;
    } else if (normalized === 'pending') {
      order.payment_status = 'pending';
      if (order.status === 'submitted') {
        order.status = 'payment_pending';
      }
      changed = true;
    }

    if (!changed) {
      return res.status(400).json({ message: 'Unsupported status' });
    }

    order.updated_at = new Date();
    // Optionally track last payment provider / transaction id in custom fields
    if (provider) order.payment_method = order.payment_method || provider;
    if (transaction_id) order.payment_txn_id = transaction_id; // not in schema, Mongoose will still store

    await order.save();

    const io = getIO();
    if (io) {
      io.to(`customer-${order.customer_id}`).emit('order:update', order);
      io.to(`restaurant-${order.restaurant_id}`).emit('order:update', order);
    }

    return res.json({ message: 'Payment status updated', order });
  } catch (e) {
    next(e);
  }
};

exports.listRestaurantOrders = async (req, res, next) => {
  try {
    const role = req.user.role;
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const {
      restaurant_id,
      status,
      page = 1,
      limit = 20,
    } = req.query;
    if (!restaurant_id) {
      return res
        .status(400)
        .json({ message: 'restaurant_id is required' });
    }

    const defaultStatuses = [
      'submitted',
      'payment_pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'ready_for_delivery',
      'delivering',
      'completed',
      'cancelled',
      'payment_failed',
    ];
    const statuses = (status
      ? String(status).split(',')
      : defaultStatuses
    )
      .map((s) => s.trim())
      .filter((s) => ORDER_STATUSES.includes(s));
    if (statuses.length === 0) {
      return res
        .status(400)
        .json({ message: 'No valid statuses provided' });
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
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { orderId } = req.params;
    const { status, restaurant_id, restaurant_location, customer_location } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }
    const allowedStatuses = [
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'ready_for_delivery',
      'delivering',
      'completed',
      'cancelled',
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (restaurant_id && String(order.restaurant_id) !== String(restaurant_id)) {
      return res.status(400).json({ message: 'restaurant_id mismatch' });
    }

    const oldStatus = order.status;
    const errors = [];

    const restaurantLoc = restaurant_location || DEFAULT_RESTAURANT_LOCATION;
    const customerLoc = customer_location || DEFAULT_CUSTOMER_LOCATION;

    // Assign nearest drone when kitchen starts preparing
    if (status === 'preparing' && oldStatus !== 'preparing' && !DRONES_DISABLED) {
      try {
        const assignRes = await assignDroneForOrder(
          orderId,
          restaurantLoc,
          customerLoc,
          order.pin_code
        );
        const assignedId =
          assignRes.data?.drone?.droneId ||
          assignRes.data?.drone?.id ||
          assignRes.data?.drone?._id;
        if (assignedId) {
          order.assigned_drone_id = assignedId;
        } else {
          errors.push('Drone assigned but missing id');
        }
      } catch (droneError) {
        console.error('Drone service error on assign:', droneError.message);
        errors.push('Unable to assign drone right now');
      }
    }

    // Owner starts delivery -> send drone to customer
    if (status === 'delivering' && oldStatus !== 'delivering' && !DRONES_DISABLED) {
      try {
        if (!order.assigned_drone_id) {
          // Try to assign if not already done
          const assignRes = await assignDroneForOrder(
            orderId,
            restaurantLoc,
            customerLoc,
            order.pin_code
          );
          const assignedId =
            assignRes.data?.drone?.droneId ||
            assignRes.data?.drone?.id ||
            assignRes.data?.drone?._id;
          if (assignedId) {
            order.assigned_drone_id = assignedId;
          }
        }

        if (!order.assigned_drone_id) {
          errors.push('No drone assigned; delivery not started');
        } else {
          await startDroneDelivery(orderId, customerLoc);
        }
      } catch (droneError) {
        console.error('Drone service error on start-delivery:', droneError.message);
        errors.push('Drone could not start delivery');
      }
    }

    order.status = status;
    if (status === 'completed') {
      order.completed_at = new Date();
    }
    order.updated_at = new Date();

    await order.save();

    const io = getIO();
    if (io) {
      io.to(`customer-${order.customer_id}`).emit('order:update', order);
      io.to(`restaurant-${order.restaurant_id}`).emit('order:update', order);
    }

    res.json({ order, warnings: errors });
  } catch (e) {
    next(e);
  }
};

// Verify PIN for delivery completion
exports.verifyPin = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { pin } = req.body;

    if (!pin || pin.length !== 4) {
      return res.status(400).json({ message: 'PIN must be 4 digits' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'delivering' && order.status !== 'arrived') {
      return res.status(400).json({ message: 'Order is not ready for PIN verification' });
    }

    if (order.pin_code !== pin) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect PIN. Please try again.',
      });
    }

    // Ensure drone actually reached the customer
    if (!DRONES_DISABLED) {
      try {
        const arrival = await fetchDroneArrival(orderId);
        if (!arrival.data?.droneArrived) {
          return res.status(400).json({
            success: false,
            message: 'Drone has not arrived yet. Please wait a moment.',
          });
        }
      } catch (droneError) {
        console.error('Arrival check failed:', droneError.message);
        return res.status(400).json({
          success: false,
          message: 'Unable to verify drone arrival. Try again shortly.',
        });
      }
    }

    if (!DRONES_DISABLED) {
      try {
        await verifyWithDroneService(orderId, pin);
      } catch (droneError) {
        console.error('Drone PIN verification failed:', droneError.message);
        return res.status(400).json({
          success: false,
          message:
            droneError?.response?.data?.message ||
            'Drone did not accept the PIN yet. Please retry.',
        });
      }
    }

    // PIN accepted - complete the order
    order.status = 'completed';
    order.completed_at = new Date();
    order.updated_at = new Date();
    await order.save();

    // Notify via socket
    const io = getIO();
    if (io) {
      io.to(`customer-${order.customer_id}`).emit('order:update', order);
      io.to(`restaurant-${order.restaurant_id}`).emit('order:update', order);
    }

    res.json({
      success: true,
      message: 'Delivery completed successfully!',
      order,
    });
  } catch (e) {
    next(e);
  }
};

