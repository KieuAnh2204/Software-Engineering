const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

const ensureUserServiceConfigured = () => {
  if (!USER_SERVICE_URL) {
    throw new Error('USER_SERVICE_URL is not configured');
  }
};

const fetchUserProfile = async (userId, token) => {
  if (!USER_SERVICE_URL) {
    return null;
  }

  try {
    const response = await axios.get(
      `${USER_SERVICE_URL}/api/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data?.data || null;
  } catch (error) {
    console.error('Failed to fetch user profile from user-service:', error.message);
    return null;
  }
};

const checkRestaurantOwnership = async (restaurantId, userId) => {
  try {
    ensureUserServiceConfigured();
    const response = await axios.get(
      `${USER_SERVICE_URL}/api/restaurants/${restaurantId}/check-owner`,
      {
        params: {
          user_id: userId
        }
      }
    );

    return Boolean(response.data?.isOwner);
  } catch (error) {
    console.error('Failed to verify restaurant ownership:', error.message);
    return false;
  }
};

module.exports = {
  fetchUserProfile,
  checkRestaurantOwnership
};
