const Dish = require('../models/Dish');
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
 * @desc    Tạo món ăn mới
 * @route   POST /api/dishes
 * @access  Private (BRAND_MANAGER only)
 */
exports.createDish = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      discountPrice,
      categoryId, 
      restaurantId, 
      images,
      preparationTime,
      unit,
      nutrition,
      tags,
      displayOrder
    } = req.body;
    const userId = req.user._id;

    if (!restaurantId || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID and Category ID are required'
      });
    }

    // Bước 1: Xác thực quyền sở hữu restaurant
    const isOwner = await verifyRestaurantOwnership(restaurantId, userId);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create dish for this restaurant'
      });
    }

    // Bước 2: Kiểm tra category có thuộc restaurant không
    const category = await Category.findOne({ 
      _id: categoryId, 
      restaurantId 
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or does not belong to this restaurant'
      });
    }

    // Bước 3: Tạo dish mới
    const dish = await Dish.create({
      name,
      description,
      price,
      discountPrice,
      categoryId,
      restaurantId,
      images,
      preparationTime,
      unit,
      nutrition,
      tags,
      displayOrder
    });

    res.status(201).json({
      success: true,
      message: 'Dish created successfully',
      data: dish
    });
  } catch (error) {
    console.error('Create dish error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Lấy tất cả dishes theo restaurant hoặc category
 * @route   GET /api/dishes?restaurantId=xxx&categoryId=xxx
 * @access  Public
 */
exports.getDishesByRestaurant = async (req, res) => {
  try {
    const { restaurantId, categoryId, isAvailable } = req.query;

    const query = {};
    
    if (restaurantId) query.restaurantId = restaurantId;
    if (categoryId) query.categoryId = categoryId;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    const dishes = await Dish.find(query)
      .populate('categoryId', 'name')
      .sort({ displayOrder: 1, soldCount: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: dishes.length,
      data: dishes
    });
  } catch (error) {
    console.error('Get dishes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thông tin dish theo ID
 * @route   GET /api/dishes/:id
 * @access  Public
 */
exports.getDishById = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id)
      .populate('categoryId', 'name description');

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    res.status(200).json({
      success: true,
      data: dish
    });
  } catch (error) {
    console.error('Get dish error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Cập nhật dish
 * @route   PUT /api/dishes/:id
 * @access  Private (Owner only)
 */
exports.updateDish = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    // Xác thực quyền sở hữu
    const userId = req.user._id;
    const isOwner = await verifyRestaurantOwnership(dish.restaurantId, userId);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this dish'
      });
    }

    const allowedFields = [
      'name', 'description', 'price', 'discountPrice', 'categoryId',
      'images', 'isAvailable', 'preparationTime', 'unit', 'nutrition',
      'tags', 'displayOrder'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        dish[field] = req.body[field];
      }
    });

    await dish.save();

    res.status(200).json({
      success: true,
      message: 'Dish updated successfully',
      data: dish
    });
  } catch (error) {
    console.error('Update dish error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Xóa dish
 * @route   DELETE /api/dishes/:id
 * @access  Private (Owner only)
 */
exports.deleteDish = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    // Xác thực quyền sở hữu
    const userId = req.user._id;
    const isOwner = await verifyRestaurantOwnership(dish.restaurantId, userId);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this dish'
      });
    }

    await dish.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Dish deleted successfully'
    });
  } catch (error) {
    console.error('Delete dish error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Tìm kiếm dishes
 * @route   GET /api/dishes/search?keyword=xxx&restaurantId=xxx
 * @access  Public
 */
exports.searchDishes = async (req, res) => {
  try {
    const { keyword, restaurantId } = req.query;

    const query = { isAvailable: true };

    if (restaurantId) {
      query.restaurantId = restaurantId;
    }

    if (keyword) {
      query.$text = { $search: keyword };
    }

    const dishes = await Dish.find(query)
      .populate('categoryId', 'name')
      .limit(50)
      .sort({ soldCount: -1, 'rating.average': -1 });

    res.status(200).json({
      success: true,
      count: dishes.length,
      data: dishes
    });
  } catch (error) {
    console.error('Search dishes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
