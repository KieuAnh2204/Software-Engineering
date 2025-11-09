const axios = require('axios');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;

const ensureProductServiceConfigured = () => {
  if (!PRODUCT_SERVICE_URL) {
    throw new Error('PRODUCT_SERVICE_URL is not configured');
  }
};

const fetchDishById = async (dishId) => {
  ensureProductServiceConfigured();

  try {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/dishes/${dishId}`);
    return response.data?.data || null;
  } catch (error) {
    console.error(`Failed to fetch dish ${dishId} from product-service:`, error.message);
    return null;
  }
};

const fetchDishesByIds = async (dishIds = []) => {
  const uniqueIds = [...new Set(dishIds.map((id) => id.toString()))];

  const dishes = await Promise.all(uniqueIds.map((id) => fetchDishById(id)));

  return dishes.reduce((acc, dish) => {
    if (dish?._id) {
      acc[dish._id] = dish;
    }
    return acc;
  }, {});
};

module.exports = {
  fetchDishById,
  fetchDishesByIds
};
