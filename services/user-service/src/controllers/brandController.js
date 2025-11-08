import RestaurantBrand from '../models/RestaurantBrand.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';

/**
 * @desc    Tạo thương hiệu mới
 * @route   POST /api/brands
 * @access  Private (BRAND_MANAGER only)
 */
export const createBrand = async (req, res) => {
  try {
    const { name, description, logo } = req.body;
    const userId = req.user._id;

    // Kiểm tra user có role BRAND_MANAGER
    if (req.user.role !== 'BRAND_MANAGER' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only BRAND_MANAGER can create brands'
      });
    }

    // Kiểm tra brand đã tồn tại chưa
    const existingBrand = await RestaurantBrand.findOne({ 
      name, 
      ownerId: userId 
    });

    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: 'Brand with this name already exists'
      });
    }

    // Tạo brand mới
    const brand = await RestaurantBrand.create({
      name,
      description,
      logo,
      ownerId: userId,
      ownerEmail: req.user.email,
      ownerName: req.user.fullName || req.user.username
    });

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: brand
    });
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy tất cả brands của user
 * @route   GET /api/brands
 * @access  Private
 */
export const getBrandsByOwner = async (req, res) => {
  try {
    const userId = req.user._id;

    const brands = await RestaurantBrand.find({ ownerId: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thông tin brand theo ID
 * @route   GET /api/brands/:id
 * @access  Public
 */
export const getBrandById = async (req, res) => {
  try {
    const brand = await RestaurantBrand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    res.status(200).json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Cập nhật thông tin brand
 * @route   PUT /api/brands/:id
 * @access  Private (Owner only)
 */
export const updateBrand = async (req, res) => {
  try {
    const brand = await RestaurantBrand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    // Kiểm tra quyền sở hữu
    if (brand.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this brand'
      });
    }

    const { name, description, logo, status } = req.body;

    if (name) brand.name = name;
    if (description) brand.description = description;
    if (logo) brand.logo = logo;
    if (status) brand.status = status;

    await brand.save();

    res.status(200).json({
      success: true,
      message: 'Brand updated successfully',
      data: brand
    });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Xóa brand
 * @route   DELETE /api/brands/:id
 * @access  Private (Owner only)
 */
export const deleteBrand = async (req, res) => {
  try {
    const brand = await RestaurantBrand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    // Kiểm tra quyền sở hữu
    if (brand.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this brand'
      });
    }

    // Kiểm tra xem brand có restaurants không
    const restaurantCount = await Restaurant.countDocuments({ brandId: brand._id });
    if (restaurantCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete brand with existing restaurants. Delete all restaurants first.'
      });
    }

    await brand.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
