import express from 'express';
import { body } from 'express-validator';
import { 
  registerCustomer,
  registerRestaurant,
  loginCustomer,
  loginRestaurant,
  getCustomerMe,
  getBrandMe,
  getMyRestaurants,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ==================== VALIDATION RULES ====================

// Validation cho đăng ký Customer
const customerRegisterValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('address').notEmpty().withMessage('Address is required')
];

// Validation cho đăng ký Restaurant Owner (Brand Manager)
const restaurantOwnerRegisterValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('name').notEmpty().withMessage('Brand name is required'),
  body('logo_url').optional().isURL().withMessage('Logo URL must be valid')
];

// Validation cho login
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Validation cho tạo Restaurant
const createRestaurantValidation = [
  body('name').notEmpty().withMessage('Restaurant name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('phone').notEmpty().withMessage('Phone number is required')
];

// ==================== ROUTES ====================

// Đăng ký Customer
router.post('/register/customer', customerRegisterValidation, registerCustomer);

// Đăng ký Restaurant Brand (Brand Manager)
router.post('/register/restaurant', restaurantOwnerRegisterValidation, registerRestaurant);

// Login tách biệt
router.post('/login/customer', loginValidation, loginCustomer);
router.post('/login/restaurant', loginValidation, loginRestaurant);

// Profile endpoints
router.get('/customers/me', authenticate, getCustomerMe);
router.get('/brands/me', authenticate, getBrandMe);

// Restaurant management (RESTAURANT_OWNER only)
router.get('/restaurants/my', authenticate, getMyRestaurants);

// Admin route moved to restaurantsRoutes

export default router;
