import express from 'express';
import { body } from 'express-validator';
import { register, login, getProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').optional().trim().isLength({ max: 100 }).withMessage('Full name cannot exceed 100 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('role').optional().isIn(['customer', 'restaurant', 'admin']).withMessage('Invalid role')
];

const loginValidation = [
  body('password').notEmpty().withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', protect, getProfile);

export default router;
