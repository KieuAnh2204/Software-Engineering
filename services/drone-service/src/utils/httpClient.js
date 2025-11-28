const axios = require('axios');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3002/api/orders';

// Get order by ID
exports.getOrderById = async (orderId) => {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error.message);
    throw error;
  }
};

// Update order status
exports.updateOrderStatus = async (orderId, status) => {
  try {
    const response = await axios.patch(`${ORDER_SERVICE_URL}/${orderId}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating order ${orderId}:`, error.message);
    throw error;
  }
};
