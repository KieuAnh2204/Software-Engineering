import express from 'express';
import { body } from 'express-validator';
import { 
  getAllBrands,
  getBrandById
} from '../controllers/brandController.js';
import { createRestaurantUnderBrand } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllBrands); // GET /api/brands - Lấy tất cả brands (có pagination)
router.get('/:id', getBrandById); // GET /api/brands/:id - Lấy brand theo ID (kèm restaurants)

// Brand owner creates restaurant under its brand
const createRestaurantValidation = [
  body('name').notEmpty().withMessage('Restaurant name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('phone').notEmpty().withMessage('Phone number is required')
];

router.post('/:brandId/restaurants', authenticate, createRestaurantValidation, createRestaurantUnderBrand);

export default router;
