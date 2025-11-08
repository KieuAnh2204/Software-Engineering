import express from 'express';
import { 
  createRestaurant,
  getRestaurantsByBrand,
  getRestaurantById,
  checkRestaurantOwnership,
  updateRestaurant,
  deleteRestaurant
} from '../controllers/restaurantController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getRestaurantsByBrand);
router.get('/:id', getRestaurantById);

// Internal API - Server-to-Server (không cần auth token)
router.get('/:id/check-owner', checkRestaurantOwnership);

// Protected routes - Yêu cầu authentication
router.use(authenticate);

router.post('/', createRestaurant);
router.put('/:id', updateRestaurant);
router.delete('/:id', deleteRestaurant);

export default router;
