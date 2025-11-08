const express = require('express');
const { 
  createDish,
  getDishesByRestaurant,
  getDishById,
  updateDish,
  deleteDish,
  searchDishes
} = require('../controllers/dishController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getDishesByRestaurant);
router.get('/search', searchDishes);
router.get('/:id', getDishById);

// Protected routes - Yêu cầu authentication
router.use(authenticate);

router.post('/', createDish);
router.put('/:id', updateDish);
router.delete('/:id', deleteDish);

module.exports = router;
