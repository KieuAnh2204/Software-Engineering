import User from '../models/User.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, isActive } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalUsers: count
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res, next) => {
  try {
    // Users can only view their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to view this profile' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = async (req, res, next) => {
  try {
    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { fullName, phone, address } = req.body;
    
    // Only allow certain fields to be updated
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ========== RESTAURANT ROUTES ==========

// @desc    Get all restaurants
// @route   GET /api/users/restaurants
// @access  Public
export const getAllRestaurants = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isAcceptingOrders, 
      isVerified,
      cuisineType,
      priceRange,
      city,
      district
    } = req.query;
    
    const query = { 
      role: 'restaurant',
      isActive: true
    };
    
    // Filter options
    if (isAcceptingOrders !== undefined) {
      query['restaurantProfile.isAcceptingOrders'] = isAcceptingOrders === 'true';
    }
    if (isVerified !== undefined) {
      query['restaurantProfile.isVerified'] = isVerified === 'true';
    }
    if (cuisineType) {
      query['restaurantProfile.cuisineType'] = cuisineType;
    }
    if (priceRange) {
      query['restaurantProfile.priceRange'] = priceRange;
    }
    if (city) {
      query['restaurantProfile.address.city'] = new RegExp(city, 'i');
    }
    if (district) {
      query['restaurantProfile.address.district'] = new RegExp(district, 'i');
    }

    const restaurants = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'restaurantProfile.rating.average': -1, createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: restaurants,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRestaurants: count
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant by ID
// @route   GET /api/users/restaurants/:id
// @access  Public
export const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await User.findOne({
      _id: req.params.id,
      role: 'restaurant',
      isActive: true
    }).select('-password');
    
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
    next(error);
  }
};

// @desc    Search restaurants
// @route   GET /api/users/restaurants/search
// @access  Public
export const searchRestaurants = async (req, res, next) => {
  try {
    const { 
      q, 
      cuisine, 
      city, 
      district,
      priceRange,
      minRating,
      isAcceptingOrders = true
    } = req.query;
    
    const query = { 
      role: 'restaurant',
      isActive: true,
      'restaurantProfile.isAcceptingOrders': isAcceptingOrders === 'true'
    };
    
    // Text search in restaurant name or description
    if (q) {
      query.$or = [
        { 'restaurantProfile.restaurantName': new RegExp(q, 'i') },
        { 'restaurantProfile.description': new RegExp(q, 'i') }
      ];
    }
    
    // Filter by cuisine type
    if (cuisine) {
      query['restaurantProfile.cuisineType'] = cuisine;
    }
    
    // Filter by location
    if (city) {
      query['restaurantProfile.address.city'] = new RegExp(city, 'i');
    }
    if (district) {
      query['restaurantProfile.address.district'] = new RegExp(district, 'i');
    }
    
    // Filter by price range
    if (priceRange) {
      query['restaurantProfile.priceRange'] = priceRange;
    }
    
    // Filter by minimum rating
    if (minRating) {
      query['restaurantProfile.rating.average'] = { $gte: parseFloat(minRating) };
    }

    const restaurants = await User.find(query)
      .select('-password')
      .sort({ 'restaurantProfile.rating.average': -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant accepting orders status
// @route   PUT /api/users/restaurants/:id/status
// @access  Private (Restaurant owner only)
export const updateRestaurantStatus = async (req, res, next) => {
  try {
    // Only restaurant owner can update their own status
    if (req.user.role !== 'restaurant' || req.user.id !== req.params.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this restaurant' 
      });
    }

    const { isAcceptingOrders } = req.body;
    
    const restaurant = await User.findByIdAndUpdate(
      req.params.id,
      { 'restaurantProfile.isAcceptingOrders': isAcceptingOrders },
      { new: true, runValidators: true }
    ).select('-password');

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
    next(error);
  }
};

