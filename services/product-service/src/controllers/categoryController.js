const Category = require('../models/Category');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

/**
 * Helper function: Kiểm tra quyền sở hữu restaurant từ User Service
 */
const verifyRestaurantOwnership = async (restaurantId, userId) => {
  try {
    const response = await axios.get(
      `${USER_SERVICE_URL}/api/restaurants/${restaurantId}/check-owner`,
      {
        params: { user_id: userId }
      }
    );
    
    return response.data.isOwner;
  } catch (error) {
    console.error('Error verifying restaurant ownership:', error.message);
    throw new Error('Cannot verify restaurant ownership');
  }
};

/**
 * @desc    Tạo danh mục mới
 * @route   POST /api/categories
 * @access  Private (BRAND_MANAGER only)
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, description, restaurantId, image, displayOrder } = req.body;
    const userId = req.user._id;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required'
      });
    }

    // Bước quan trọng: Gọi User Service để xác thực quyền sở hữu
    const isOwner = await verifyRestaurantOwnership(restaurantId, userId);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create category for this restaurant'
      });
    }

    // Kiểm tra category đã tồn tại chưa
    const existingCategory = await Category.findOne({ 
      name, 
      restaurantId 
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists in this restaurant'
      });
    }

    // Tạo category mới
    const category = await Category.create({
      name,
      description,
      restaurantId,
      image,
      displayOrder
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Lấy tất cả categories theo restaurant
 * @route   GET /api/categories?restaurantId=xxx
 * @access  Public
 */
exports.getCategoriesByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required'
      });
    }

    const categories = await Category.find({ 
      restaurantId,
      isActive: true 
    }).sort({ displayOrder: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thông tin category theo ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Cập nhật category
 * @route   PUT /api/categories/:id
 * @access  Private (Owner only)
 */
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Xác thực quyền sở hữu
    const userId = req.user._id;
    const isOwner = await verifyRestaurantOwnership(category.restaurantId, userId);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this category'
      });
    }

    const { name, description, image, displayOrder, isActive } = req.body;

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Xóa category
 * @route   DELETE /api/categories/:id
 * @access  Private (Owner only)
 */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Xác thực quyền sở hữu
    const userId = req.user._id;
    const isOwner = await verifyRestaurantOwnership(category.restaurantId, userId);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this category'
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
