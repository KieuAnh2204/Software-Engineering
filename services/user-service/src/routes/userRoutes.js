import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', authorize('admin'), getAllUsers);
router.delete('/:id', authorize('admin'), deleteUser);

// User routes
router.get('/:id', getUserById);
router.put('/:id', updateUser);

export default router;
