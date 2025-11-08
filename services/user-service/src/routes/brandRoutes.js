import express from 'express';
import { 
  createBrand, 
  getBrandsByOwner, 
  getBrandById, 
  updateBrand, 
  deleteBrand 
} from '../controllers/brandController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/:id', getBrandById);

// Protected routes - Yêu cầu authentication
router.use(authenticate);

router.post('/', createBrand);
router.get('/', getBrandsByOwner);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);

export default router;
