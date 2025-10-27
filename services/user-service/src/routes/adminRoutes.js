import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  restoreUser,
  getAllRestaurants,
  verifyRestaurant,
  updateRestaurantOrderStatus,
  resetUserPassword,
  unlockUserAccount
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication and admin role check to all routes
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/restore', restoreUser);
router.put('/users/:id/reset-password', resetUserPassword);
router.put('/users/:id/unlock', unlockUserAccount);
router.delete('/users/:id', deleteUser);

// Restaurant Management
router.get('/restaurants', getAllRestaurants);
router.put('/restaurants/:id/verify', verifyRestaurant);
router.put('/restaurants/:id/accepting-orders', updateRestaurantOrderStatus);

export default router;
