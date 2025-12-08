const express = require('express');
const {
  uploadImage,
  createDish,
  getDishes,
  getDishById,
  updateDish,
  deleteDish
} = require('../controllers/dishController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadDishImage } = require('../services/multerConfig');

const router = express.Router();

router.get('/', getDishes);
router.get('/:id', getDishById);

router.post(
  '/upload-image',
  authenticate,
  authorize('owner', 'admin'),
  uploadDishImage.single('image'),
  uploadImage
);

router.post('/', authenticate, authorize('owner', 'admin'), uploadDishImage.single('image'), createDish);
router.put('/:id', authenticate, authorize('owner', 'admin'), uploadDishImage.single('image'), updateDish);
router.delete('/:id', authenticate, authorize('owner', 'admin'), deleteDish);

module.exports = router;
