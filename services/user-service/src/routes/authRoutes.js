import express from 'express';
import { body } from 'express-validator';
import {
  register,
  registerCustomer,
  registerRestaurantOwner,
  loginCustomer,
  loginRestaurantOwner,
  loginAdmin,
  getCustomerMe,
  getOwnerMe
} from '../controllers/authController.js';
import { updateCustomerProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const requireNameOrFullName = (message) =>
  body('name').custom((value, { req }) => {
    const candidate = value || req.body.full_name;
    if (!candidate || !String(candidate).trim()) {
      throw new Error(message);
    }
    if (!value && req.body.full_name) {
      req.body.name = req.body.full_name;
    }
    return true;
  });

const customerRegisterValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  requireNameOrFullName('Full name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('address').notEmpty().withMessage('Address is required')
];

const ownerRegisterValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  requireNameOrFullName('Owner display name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('logo_url').custom((value) => {
    if (!value || value.trim() === '') return true; // Allow empty
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(value)) {
      throw new Error('Logo URL must be valid');
    }
    return true;
  })
];

const genericRegisterValidation = [
  body('role').notEmpty().withMessage('Role is required'),
  body('role').isIn(['customer', 'owner']).withMessage('Invalid role. Allowed roles: customer, owner'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  requireNameOrFullName('Name is required')
    .if((value, { req }) => ['customer', 'owner'].includes(req.body.role)),
  body('phone')
    .if((value, { req }) => ['customer', 'owner'].includes(req.body.role))
    .notEmpty()
    .withMessage('Phone number is required'),
  body('address')
    .if((value, { req }) => req.body.role === 'customer')
    .notEmpty()
    .withMessage('Address is required for customers'),
  body('name')
    .if((value, { req }) => req.body.role === 'owner')
    .notEmpty()
    .withMessage('Owner display name is required for owners'),
  body('logo_url')
    .if((value, { req }) => req.body.role === 'owner' && value)
    .isURL()
    .withMessage('Logo URL must be valid when provided')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', genericRegisterValidation, register);
router.post('/register/customer', customerRegisterValidation, registerCustomer);
router.post('/register/owner', ownerRegisterValidation, registerRestaurantOwner);

router.post('/login/customer', loginValidation, loginCustomer);
router.post('/login/owner', loginValidation, loginRestaurantOwner);
router.post('/login/admin', loginValidation, loginAdmin);

router.get('/customers/me', authenticate, getCustomerMe);
router.get('/owners/me', authenticate, getOwnerMe);

// Update customer profile
router.patch('/profile', authenticate, [
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty')
], updateCustomerProfile);

export default router;
