const Order = require('../models/Order');
const http = require('../utils/httpClient');
const { AppError } = require('../utils/appError');

function recalcTotal(order) {
  const total = order.items.reduce(
    (sum, it) => sum + Number(it.price) * Number(it.quantity),
    0
  );
  order.total_amount = Math.max(0, Math.round(total));
  return order;
}

async function getOrCreateCart(customerId, restaurantId) {
  let cart = await Order.findOne({
    customer_id: customerId,
    restaurant_id: restaurantId,
    status: 'cart',
  });

  if (cart && cart.expires_at && cart.expires_at < new Date()) {
    cart.status = 'expired';
    cart.updated_at = new Date();
    await cart.save();
    cart = null;
  }

  if (!cart) {
    cart = await Order.create({
      customer_id: customerId,
      restaurant_id: restaurantId,
      status: 'cart',
      items: [],
      total_amount: 0,
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }
  return cart;
}

async function fetchProduct(productId) {
  const base = process.env.PRODUCT_SERVICE_URL;
  if (!base) throw AppError.badRequest('PRODUCT_SERVICE_URL is not configured');
  const url = `${base.replace(/\/+$/, '')}/api/dishes/${productId}`;
  try {
    const { data } = await http.get(url);
    const product = data?.data || data;
    if (!product) throw AppError.notFound('Product not found');
    if (product.is_available === false) {
      throw AppError.badRequest('Product is not available');
    }
    if (Number.isNaN(Number(product.price))) {
      throw AppError.badRequest('Product price is invalid');
    }
    return product;
  } catch (err) {
    if (err.response?.status === 404) {
      throw AppError.notFound('Product not found');
    }
    throw new AppError('Product service unavailable', 502);
  }
}

async function addItemToCart({
  customer_id,
  restaurant_id,
  productId,
  quantity = 1,
  notes = '',
}) {
  const qty = Number(quantity ?? 1);
  if (!Number.isInteger(qty) || qty <= 0) {
    throw AppError.badRequest('quantity must be a positive integer');
  }

  const product = await fetchProduct(productId);

  const prodRestId = String(
    product.restaurant_id?._id ||
      product.restaurant_id ||
      product.restaurantId?._id ||
      product.restaurantId
  );
  if (String(prodRestId) !== String(restaurant_id)) {
    throw AppError.badRequest('Product does not belong to this restaurant');
  }

  const cart = await getOrCreateCart(customer_id, restaurant_id);

  const existing = cart.items.find(
    (it) => it.productId === productId && (it.notes || '') === (notes || '')
  );
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.items.push({
      productId,
      name: product.name,
      price: Number(product.price),
      quantity: qty,
      image: product.image_url || product.image,
      notes,
    });
  }

  recalcTotal(cart);
  cart.updated_at = new Date();
  await cart.save();
  return cart;
}

async function updateCartItem({
  customer_id,
  restaurant_id,
  itemId,
  quantity,
  notes,
}) {
  const cart = await Order.findOne({
    customer_id,
    restaurant_id,
    status: 'cart',
  });
  if (!cart) throw AppError.notFound('Cart not found');
  const item = cart.items.id(itemId);
  if (!item) throw AppError.notFound('Item not found');

  if (quantity !== undefined) {
    const qty = Number(quantity);
    if (!Number.isInteger(qty)) {
      throw AppError.badRequest('quantity must be an integer');
    }
    if (qty <= 0) item.deleteOne();
    else item.quantity = qty;
  }
  if (notes !== undefined) {
    if (typeof notes !== 'string') {
      throw AppError.badRequest('notes must be a string');
    }
    item.notes = notes;
  }

  recalcTotal(cart);
  cart.updated_at = new Date();
  await cart.save();
  return cart;
}

async function removeCartItem({ customer_id, restaurant_id, itemId }) {
  const cart = await Order.findOne({
    customer_id,
    restaurant_id,
    status: 'cart',
  });
  if (!cart) throw AppError.notFound('Cart not found');
  const item = cart.items.id(itemId);
  if (!item) throw AppError.notFound('Item not found');
  item.deleteOne();
  recalcTotal(cart);
  cart.updated_at = new Date();
  await cart.save();
  return cart;
}

async function clearCart({ customer_id, restaurant_id }) {
  const cart = await Order.findOne({
    customer_id,
    restaurant_id,
    status: 'cart',
  });
  if (!cart) return null;
  cart.status = 'expired';
  cart.items = [];
  cart.total_amount = 0;
  cart.expires_at = new Date();
  cart.updated_at = new Date();
  await cart.save();
  return cart;
}

module.exports = {
  getOrCreateCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  recalcTotal,
};

