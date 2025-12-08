const express = require('express');
const { body, validationResult } = require('express-validator');
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
const timePattern = /^([0-1]\d|2[0-3]):([0-5]\d)$/;

const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

const createRestaurantValidation = validate([
  body('name').notEmpty().withMessage('name is required'),
  body('phone').notEmpty().withMessage('phone is required'),
  body('address').notEmpty().withMessage('address is required'),
  body('open_time')
    .optional()
    .matches(timePattern)
    .withMessage('open_time must be HH:mm'),
  body('close_time')
    .optional()
    .matches(timePattern)
    .withMessage('close_time must be HH:mm')
]);

const updateRestaurantValidation = validate([
  body('name').optional().notEmpty().withMessage('name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('phone cannot be empty'),
  body('address').optional().notEmpty().withMessage('address cannot be empty'),
  body('open_time')
    .optional()
    .matches(timePattern)
    .withMessage('open_time must be HH:mm'),
  body('close_time')
    .optional()
    .matches(timePattern)
    .withMessage('close_time must be HH:mm')
]);

router.get('/', getRestaurants);
router.get('/owner/me', authenticate, authorize('owner'), async (req, res) => {
  try {
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findOne({ owner_id: req.user.id });
    
    if (!restaurant) {
      return res.status(404).json({ 
        success: false, 
        message: 'No restaurant found for this owner' 
      });
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Get owner restaurant error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/:id', getRestaurantById);

router.post('/', authenticate, authorize('owner', 'admin'), createRestaurantValidation, createRestaurant);
router.put('/:id', authenticate, authorize('owner', 'admin'), updateRestaurantValidation, updateRestaurant);
router.patch('/:id/status', authenticate, authorize('admin'), updateRestaurantStatus);
router.delete('/:id', authenticate, authorize('admin'), deleteRestaurant);

module.exports = router;
