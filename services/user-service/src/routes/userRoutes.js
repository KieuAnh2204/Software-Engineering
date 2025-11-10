import express from 'express';
import { 
  getAllCustomers,
  getAllRestaurantBrands
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected routes - Admin only
router.use(authenticate, authorize('ADMIN'));

// GET /api/users/customers - Lấy tất cả customers (pagination)
router.get('/customers', getAllCustomers);

// GET /api/users/brands - Lấy tất cả restaurant brands (pagination + status filter)
router.get('/brands', getAllRestaurantBrands);

export default router;
