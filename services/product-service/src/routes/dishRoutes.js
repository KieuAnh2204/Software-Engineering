const express = require('express');
const {
  createDish,
  getDishes,
  getDishById,
  updateDish,
  deleteDish
} = require('../controllers/dishController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getDishes);
router.get('/:id', getDishById);

router.post('/', authenticate, authorize('owner', 'admin'), createDish);
router.put('/:id', authenticate, authorize('owner', 'admin'), updateDish);
router.delete('/:id', authenticate, authorize('owner', 'admin'), deleteDish);

module.exports = router;
