const Order = require('../models/Order');
const http = require('../utils/httpClient');

function recalcTotal(order) {
  order.total_amount = order.items.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );
  return order;
}

async function getOrCreateCart(customerId, restaurantId) {
  let cart = await Order.findOne({
    customer_id: customerId,
    restaurant_id: restaurantId,
    status: 'cart',
  });
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
  if (!base) throw new Error('PRODUCT_SERVICE_URL is not configured');
  const url = `${base.replace(/\/+$/, '')}/api/dishes/${productId}`;
  const { data } = await http.get(url);
  // product-service wraps response as { success, data }
  return data?.data || data;
}

async function addItemToCart({
  customer_id,
  restaurant_id,
  productId,
  quantity = 1,
  notes = '',
}) {
  const product = await fetchProduct(productId);
  if (!product) throw new Error('Product not found');

  const prodRestId = String(
    product.restaurant_id?._id ||
      product.restaurant_id ||
      product.restaurantId?._id ||
      product.restaurantId
  );
  if (String(prodRestId) !== String(restaurant_id)) {
    throw new Error('Product does not belong to this restaurant');
  }

  const cart = await getOrCreateCart(customer_id, restaurant_id);

  const existing = cart.items.find(
    (it) => it.productId === productId && (it.notes || '') === (notes || '')
  );
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({
      productId,
      name: product.name,
      price: product.price,
      quantity,
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
  if (!cart) throw new Error('Cart not found');
  const item = cart.items.id(itemId);
  if (!item) throw new Error('Item not found');

  if (typeof quantity === 'number') {
    if (quantity <= 0) item.deleteOne();
    else item.quantity = quantity;
  }
  if (typeof notes === 'string') item.notes = notes;

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
  if (!cart) throw new Error('Cart not found');
  const item = cart.items.id(itemId);
  if (!item) throw new Error('Item not found');
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

