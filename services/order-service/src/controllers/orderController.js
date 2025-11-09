const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { validateCreateOrder, validateStatusUpdate } = require('../utils/orderValidation');
const { calculateOrderTotals, calculateItemTotal } = require('../utils/orderPricing');
const { fetchDishesByIds } = require('../clients/productService');
const { checkRestaurantOwnership } = require('../clients/userService');
const { ORDER_STATUSES } = require('../constants/orderStatus');

const HAS_USER_SERVICE = Boolean(process.env.USER_SERVICE_URL);

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

const normalizeModifiers = (modifiers = []) => {
  return (modifiers || []).map((modifier) => ({
    name: modifier.name,
    value: modifier.value,
    price: Number(modifier.price) || 0
  }));
};

const buildOrderItems = async (rawItems = [], restaurantId) => {
  if (!rawItems.length) {
    const error = new Error('Order must include at least one item');
    error.statusCode = 400;
    throw error;
  }

  const dishMap = await fetchDishesByIds(rawItems.map((item) => item.productId));

  const normalizedItems = rawItems.map((item) => {
    const productId = item.productId?.toString();
    const dish = dishMap[productId];

    if (!dish) {
      const error = new Error(`Dish ${productId} not found in product-service`);
      error.statusCode = 404;
      throw error;
    }

    if (restaurantId && dish.restaurantId?.toString() !== restaurantId.toString()) {
      const error = new Error('All items must belong to the same restaurant');
      error.statusCode = 400;
      throw error;
    }

    const normalizedItem = {
      clientItemId: item.clientItemId,
      productId: dish._id,
      restaurantId: dish.restaurantId,
      name: dish.name,
      description: dish.description,
      image: dish.images?.[0],
      quantity: item.quantity,
      basePrice: dish.price,
      discountPrice: dish.discountPrice,
      modifiers: normalizeModifiers(item.modifiers),
      notes: item.notes,
      preparationTime: dish.preparationTime
    };

    normalizedItem.itemTotal = calculateItemTotal(normalizedItem);
    return normalizedItem;
  });

  return normalizedItems;
};

const computeEstimatedDelivery = (items = [], scheduledFor) => {
  if (scheduledFor) {
    return new Date(scheduledFor);
  }

  const preparationTime = items.reduce((max, item) => {
    return Math.max(max, item.preparationTime || 20);
  }, 20);

  const bufferMinutes = 20;
  const etaMinutes = preparationTime + bufferMinutes;
  return new Date(Date.now() + etaMinutes * 60000);
};

const persistCartSnapshot = async ({
  cartDoc,
  items,
  userId,
  restaurantId,
  totals,
  notes
}) => {
  if (cartDoc) {
    cartDoc.items = items;
    cartDoc.status = 'checked_out';
    cartDoc.pricing = totals;
    if (notes) {
      cartDoc.notes = notes;
    }
    await cartDoc.save();
    return cartDoc;
  }

  return Cart.create({
    userId,
    restaurantId,
    status: 'checked_out',
    items,
    pricing: totals,
    notes
  });
};

exports.createOrder = async (req, res, next) => {
  try {
    const { error, value } = validateCreateOrder(req.body);
    if (error) {
      return res.status(400).json({ success: false, errors: error });
    }

    const userId = req.user.id;
    let cartDoc = null;

    if (value.cartId) {
      cartDoc = await Cart.findOne({
        _id: value.cartId,
        userId,
        status: 'active'
      });

      if (!cartDoc) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found or already checked out'
        });
      }
    }

    const targetRestaurantId = cartDoc ? cartDoc.restaurantId.toString() : value.restaurantId;
    const rawItems = cartDoc
      ? cartDoc.items.map((item) => ({
          productId: item.productId,
          clientItemId: item.clientItemId,
          quantity: item.quantity,
          notes: item.notes,
          modifiers: item.modifiers
        }))
      : value.items;

    const normalizedItems = await buildOrderItems(rawItems, targetRestaurantId);
    const totals = calculateOrderTotals(normalizedItems, {
      tipAmount: value.tipAmount,
      discountAmount: 0
    });

    const cartSnapshot = await persistCartSnapshot({
      cartDoc,
      items: normalizedItems,
      userId,
      restaurantId: targetRestaurantId,
      totals,
      notes: value.notes
    });

    const estimatedDeliveryTime = computeEstimatedDelivery(normalizedItems, value.scheduledFor);
    const paymentMethod = value.payment?.method || 'cod';
    const paymentStatus = 'pending';

    const order = await Order.create({
      userId,
      restaurantId: targetRestaurantId,
      cartId: cartSnapshot._id,
      items: normalizedItems,
      totals,
      deliveryAddress: value.deliveryAddress,
      payment: {
        method: paymentMethod,
        status: paymentStatus,
        transactionId: value.payment?.transactionId,
        provider: value.payment?.provider,
        amount: totals.total
      },
      status: 'pending',
      paymentStatus,
      estimatedDeliveryTime,
      scheduledFor: value.scheduledFor,
      notes: value.notes,
      specialInstructions: value.specialInstructions,
      metadata: value.metadata
    });

    cartSnapshot.lastSyncedOrderId = order._id;
    await cartSnapshot.save();

    return res.status(201).json({
      success: true,
      data: order
    });
  } catch (err) {
    return next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { status, restaurantId, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      if (!ORDER_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status filter'
        });
      }
      query.status = status;
    }

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    if (req.user.role === 'admin') {
      if (restaurantId) {
        query.restaurantId = restaurantId;
      }
    } else if (['restaurant', 'BRAND_MANAGER'].includes(req.user.role)) {
      query.restaurantId = restaurantId || req.user.restaurantProfile?.restaurantId || req.user.id;
    } else {
      query.userId = req.user.id;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber),
      Order.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (err) {
    return next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const isCustomer = order.userId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';
    let isRestaurantOwner = false;

    if (['restaurant', 'BRAND_MANAGER'].includes(req.user.role)) {
      if (HAS_USER_SERVICE) {
        isRestaurantOwner = await checkRestaurantOwnership(order.restaurantId, req.user.id);
      } else {
        isRestaurantOwner = order.restaurantId.toString() === req.user.id.toString();
      }
    }

    if (!(isCustomer || isAdmin || isRestaurantOwner)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    return next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { error, value } = validateStatusUpdate(req.body);
    if (error) {
      return res.status(400).json({ success: false, errors: error });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const isAdmin = req.user.role === 'admin';
    let canManage = isAdmin;

    if (!canManage && ['restaurant', 'BRAND_MANAGER'].includes(req.user.role)) {
      if (HAS_USER_SERVICE) {
        canManage = await checkRestaurantOwnership(order.restaurantId, req.user.id);
      } else {
        canManage = order.restaurantId.toString() === req.user.id.toString();
      }
    }

    if (!canManage) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    if (order.status === value.status) {
      return res.status(200).json({
        success: true,
        data: order
      });
    }

    const allowedNextStatuses = STATUS_TRANSITIONS[order.status] || [];
    if (!allowedNextStatuses.includes(value.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move order from ${order.status} to ${value.status}`
      });
    }

    order.status = value.status;

    if (value.status === 'delivered') {
      order.deliveredAt = new Date();
      order.tracking.etaMinutes = 0;
      if (order.paymentStatus === 'pending') {
        order.paymentStatus = 'paid';
      }
    }

    if (value.status === 'cancelled' && order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }

    order.addStatusHistory(
      value.status,
      value.note || `Status updated to ${value.status}`,
      req.user.id
    );

    await order.save();

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    return next(err);
  }
};
