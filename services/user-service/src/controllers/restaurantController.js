import Restaurant from '../models/Restaurant.js';
import RestaurantBrand from '../models/RestaurantBrand.js';

/**
 * @desc    Tạo chi nhánh mới (Hỗ trợ 2 kịch bản)
 * @route   POST /api/restaurants
 * @access  Private (BRAND_MANAGER only)
 * 
 * Kịch bản 1: Quán nhỏ (không cần Brand)
 *   - Gửi brandId = null hoặc không gửi
 *   - Hệ thống tự động tạo Brand mặc định
 * 
 * Kịch bản 2: Chuỗi nhà hàng (có Brand)
 *   - Gửi brandId có sẵn
 *   - Gắn restaurant vào Brand
 */
export const createRestaurant = async (req, res) => {
  try {
    const { 
      name, 
      brandId, 
      address, 
      phone, 
      email, 
      openingHours,
      images,
      deliveryRadius,
      minimumOrder 
    } = req.body;
    const userId = req.user.id || req.user._id;

    let finalBrandId = brandId;

    // KỊCH BẢN 1: Quán nhỏ - Tự động tạo Brand mặc định
    if (!brandId) {
      console.log('🏪 Small restaurant mode: Auto-creating default brand');
      
      // Tạo brand mặc định với tên giống restaurant
      const defaultBrand = await RestaurantBrand.create({
        name: name, // Tên brand = tên restaurant
        description: `Default brand for ${name}`,
        ownerId: userId,
        ownerEmail: req.user.email,
        ownerName: req.user.fullName || req.user.username
      });

      finalBrandId = defaultBrand._id;
      console.log(`✅ Auto-created brand: ${defaultBrand._id}`);
    } 
    // KỊCH BẢN 2: Chuỗi - Kiểm tra Brand có tồn tại
    else {
      const brand = await RestaurantBrand.findById(brandId);
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: 'Brand not found'
        });
      }

      // Kiểm tra quyền sở hữu brand
      if (brand.ownerId.toString() !== userId.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to create restaurant for this brand'
        });
      }
    }

    // Tạo restaurant mới
    const restaurant = await Restaurant.create({
      name,
      brandId: finalBrandId,
      address,
      phone,
      email,
      openingHours,
      images,
      deliveryRadius,
      minimumOrder
    });

    // Populate brand info để trả về đầy đủ
    await restaurant.populate('brandId', 'name logo');

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant,
      note: !brandId ? 'Auto-created default brand for small restaurant' : null
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy tất cả restaurants theo brand
 * @route   GET /api/restaurants?brandId=xxx
 * @access  Public
 */
export const getRestaurantsByBrand = async (req, res) => {
  try {
    const { brandId } = req.query;

    const query = brandId ? { brandId } : {};
    
    const restaurants = await Restaurant.find(query)
      .populate('brandId', 'name logo')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thông tin restaurant theo ID
 * @route   GET /api/restaurants/:id
 * @access  Public
 */
export const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('brandId', 'name logo description');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Kiểm tra quyền sở hữu restaurant (Internal API cho Product Service)
 * @route   GET /api/restaurants/:id/check-owner
 * @access  Internal (Server-to-Server)
 */
export const checkRestaurantOwnership = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    // Tìm restaurant
    const restaurant = await Restaurant.findById(id).populate('brandId');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
        isOwner: false
      });
    }

    // Kiểm tra ownership: Restaurant -> Brand -> Owner
    const isOwner = restaurant.brandId.ownerId.toString() === user_id.toString();

    res.status(200).json({
      success: true,
      isOwner,
      data: {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        brandId: restaurant.brandId._id,
        brandName: restaurant.brandId.name,
        ownerId: restaurant.brandId.ownerId
      }
    });
  } catch (error) {
    console.error('Check ownership error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      isOwner: false
    });
  }
};

/**
 * @desc    Cập nhật thông tin restaurant
 * @route   PUT /api/restaurants/:id
 * @access  Private (Owner only)
 */
export const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('brandId');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Kiểm tra quyền sở hữu
    if (restaurant.brandId.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this restaurant'
      });
    }

    const allowedFields = [
      'name', 'address', 'phone', 'email', 'openingHours', 
      'images', 'status', 'deliveryRadius', 'minimumOrder'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        restaurant[field] = req.body[field];
      }
    });

    await restaurant.save();

    res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully',
      data: restaurant
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Xóa restaurant
 * @route   DELETE /api/restaurants/:id
 * @access  Private (Owner only)
 */
export const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('brandId');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Kiểm tra quyền sở hữu
    if (restaurant.brandId.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this restaurant'
      });
    }

    await restaurant.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
