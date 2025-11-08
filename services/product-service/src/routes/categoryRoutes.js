const express = require('express');
const { 
  createCategory,
  getCategoriesByRestaurant,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getCategoriesByRestaurant);
router.get('/:id', getCategoryById);

// Protected routes - Yêu cầu authentication
router.use(authenticate);

router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
