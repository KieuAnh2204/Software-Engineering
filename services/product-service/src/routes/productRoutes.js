const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByRestaurant,
  searchProducts,
  getMyProducts,
  toggleAvailability,
  updateProductImages
} = require('../controllers/productController');
const { protect, restrictTo, checkRestaurantOwnership } = require('../middleware/auth');

// Public routes
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/restaurant/:restaurantId', getProductsByRestaurant);
router.get('/:id', getProduct);

// Protected routes - Restaurant owners only
router.use(protect, restrictTo('restaurant'), checkRestaurantOwnership);

router.post('/', createProduct);
router.get('/my-products/list', getMyProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/availability', toggleAvailability);
router.put('/:id/images', updateProductImages);

module.exports = router;
