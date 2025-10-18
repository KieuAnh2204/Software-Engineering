import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  getAllRestaurants,
  getRestaurantById,
  searchRestaurants,
  updateRestaurantStatus
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes - không cần authentication
router.get('/restaurants', getAllRestaurants);
router.get('/restaurants/search', searchRestaurants);
router.get('/restaurants/:id', getRestaurantById);

// Protected restaurant routes
router.put('/restaurants/:id/status', authenticate, updateRestaurantStatus);

// All other routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', authorize('admin'), getAllUsers);
router.delete('/:id', authorize('admin'), deleteUser);

// User routes
router.get('/:id', getUserById);
router.put('/:id', updateUser);

export default router;
