import express from 'express';
import { adminAuth } from '../middleware/auth.js';
import { updateRestaurantStatus } from '../controllers/restaurantController.js';

const router = express.Router();

// Admin manages restaurant status
// PATCH /api/restaurants/:id/status
router.patch('/:id/status', adminAuth, updateRestaurantStatus);

export default router;
