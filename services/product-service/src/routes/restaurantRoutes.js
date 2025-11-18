const express = require('express');
const {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  updateRestaurantStatus,
  deleteRestaurant
} = require('../controllers/restaurantController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);

router.post('/', authenticate, authorize('owner', 'admin'), createRestaurant);
router.put('/:id', authenticate, authorize('owner', 'admin'), updateRestaurant);
router.patch('/:id/status', authenticate, authorize('admin'), updateRestaurantStatus);
router.delete('/:id', authenticate, authorize('admin'), deleteRestaurant);

module.exports = router;
