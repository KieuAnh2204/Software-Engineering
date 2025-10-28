import express from 'express';
import { body } from 'express-validator';
import { 
  registerRestaurant,
  loginRestaurant,
  getRestaurantProfile,
  updateRestaurantProfile
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const restaurantRegisterValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('restaurantName').notEmpty().withMessage('Restaurant name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('description').optional(),
  body('cuisine').optional().isArray().withMessage('Cuisine must be an array')
];

const restaurantLoginValidation = [
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// ==================== RESTAURANT ROUTES ====================
// Public routes
router.post('/register', restaurantRegisterValidation, registerRestaurant);
router.post('/login', restaurantLoginValidation, loginRestaurant);

// Protected routes (Restaurant only)
router.get('/profile', authenticate, getRestaurantProfile);
router.put('/update', authenticate, updateRestaurantProfile);

export default router;
