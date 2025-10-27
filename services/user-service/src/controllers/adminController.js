import User from '../models/User.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Admin
export const getDashboardStats = async (req, res) => {
  try {
    // User statistics
    const userStats = await User.getDashboardStats();
    
    // Total users by role
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const activeUsers = await User.countDocuments({ isDeleted: false, isActive: true });
    const customers = await User.countDocuments({ role: 'customer', isDeleted: false });
    const restaurants = await User.countDocuments({ role: 'restaurant', isDeleted: false });
    const verifiedRestaurants = await User.countDocuments({ 
      role: 'restaurant', 
      'restaurantProfile.isVerified': true,
      isDeleted: false 
    });
    
    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      isDeleted: false
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          recentUsers
        },
        byRole: {
          customers,
          restaurants,
          verifiedRestaurants,
          unverifiedRestaurants: restaurants - verifiedRestaurants
        },
        breakdown: userStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Admin
export const getAllUsers = async (req, res) => {
  try {
    const {
      role,
      isActive,
      isDeleted,
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isDeleted !== undefined) query.isDeleted = isDeleted === 'true';
    else query.isDeleted = false; // Default: exclude deleted
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { 'restaurantProfile.restaurantName': { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('+password') // Include password field for admin view (hashed)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Update user status (active/inactive)
// @route   PUT /api/admin/users/:id/status
// @access  Admin
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

// @desc    Soft delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'User already deleted'
      });
    }

    // Soft delete
    await user.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// @desc    Restore deleted user
// @route   PUT /api/admin/users/:id/restore
// @access  Admin
export const restoreUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'User is not deleted'
      });
    }

    await user.restore();

    res.json({
      success: true,
      message: 'User restored successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error restoring user',
      error: error.message
    });
  }
};

// @desc    Get all restaurants with filters
// @route   GET /api/admin/restaurants
// @access  Admin
export const getAllRestaurants = async (req, res) => {
  try {
    const {
      isVerified,
      isActive,
      isAcceptingOrders,
      cuisineType,
      city,
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    // Build filters
    const filters = {};
    if (isVerified !== undefined) filters.isVerified = isVerified === 'true';
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (cuisineType) filters.cuisineType = cuisineType;
    if (city) filters.city = city;

    let query = { role: 'restaurant', isDeleted: false };
    
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isVerified !== undefined) query['restaurantProfile.isVerified'] = isVerified === 'true';
    if (isAcceptingOrders !== undefined) query['restaurantProfile.isAcceptingOrders'] = isAcceptingOrders === 'true';
    if (cuisineType) query['restaurantProfile.cuisineType'] = cuisineType;
    if (city) query['restaurantProfile.address.city'] = city;
    
    if (search) {
      query.$or = [
        { 'restaurantProfile.restaurantName': { $regex: search, $options: 'i' } },
        { 'restaurantProfile.description': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const restaurants = await User.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        restaurants,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurants',
      error: error.message
    });
  }
};

// @desc    Verify restaurant
// @route   PUT /api/admin/restaurants/:id/verify
// @access  Admin
export const verifyRestaurant = async (req, res) => {
  try {
    const { isVerified } = req.body;

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isVerified must be a boolean value'
      });
    }

    const restaurant = await User.findOne({
      _id: req.params.id,
      role: 'restaurant'
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    restaurant.restaurantProfile.isVerified = isVerified;
    await restaurant.save();

    res.json({
      success: true,
      message: `Restaurant ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: restaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying restaurant',
      error: error.message
    });
  }
};

// @desc    Update restaurant accepting orders status
// @route   PUT /api/admin/restaurants/:id/accepting-orders
// @access  Admin
export const updateRestaurantOrderStatus = async (req, res) => {
  try {
    const { isAcceptingOrders } = req.body;

    if (typeof isAcceptingOrders !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAcceptingOrders must be a boolean value'
      });
    }

    const restaurant = await User.findOne({
      _id: req.params.id,
      role: 'restaurant'
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    restaurant.restaurantProfile.isAcceptingOrders = isAcceptingOrders;
    await restaurant.save();

    res.json({
      success: true,
      message: `Restaurant order status updated successfully`,
      data: restaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating restaurant status',
      error: error.message
    });
  }
};

// @desc    Reset user password (Admin)
// @route   PUT /api/admin/users/:id/reset-password
// @access  Admin
export const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// @desc    Unlock user account
// @route   PUT /api/admin/users/:id/unlock
// @access  Admin
export const unlockUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.resetLoginAttempts();

    res.json({
      success: true,
      message: 'User account unlocked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unlocking account',
      error: error.message
    });
  }
};
