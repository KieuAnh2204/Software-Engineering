import express from 'express';
import {
  getAllCustomers,
  getAllRestaurantOwners
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/customers', getAllCustomers);
router.get('/owners', getAllRestaurantOwners);

export default router;
