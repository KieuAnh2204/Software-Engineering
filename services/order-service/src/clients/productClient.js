const { createHttpClient, withRetries } = require('../utils/http');

const baseUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003';
// product-service mounts products at /api/products
const http = createHttpClient(baseUrl);

async function getProduct(dishId) {
  return withRetries(async () => {
    const res = await http.get(`/api/products/${encodeURIComponent(dishId)}`);
    return res.data?.data || res.data; // support both {data} and direct
  });
}

module.exports = { getProduct };

