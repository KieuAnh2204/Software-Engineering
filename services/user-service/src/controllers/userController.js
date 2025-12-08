import Customer from '../models/Customer.js';
import RestaurantOwner from '../models/RestaurantOwner.js';
import User from '../models/User.js';

export const updateUserActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error updating user active status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find()
        .populate('user', '-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Customer.countDocuments()
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving customers',
      error: error.message
    });
  }
};

export const getAllRestaurantOwners = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = {};
    if (status) {
      query.status = status;
    }

    const [owners, total] = await Promise.all([
      RestaurantOwner.find(query)
        .populate('user', '-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      RestaurantOwner.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: owners,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error getting restaurant owners:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving restaurant owners',
      error: error.message
    });
  }
};

export const updateRestaurantOwnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed: APPROVED, REJECTED, SUSPENDED'
      });
    }

    const owner = await RestaurantOwner.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('user', '-password');

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant owner not found'
      });
    }

    res.json({
      success: true,
      message: `Restaurant owner status updated to ${status}`,
      data: owner
    });
  } catch (error) {
    console.error('Error updating owner status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating owner status',
      error: error.message
    });
  }
};

// Update customer profile
export const updateCustomerProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { full_name, phone, address } = req.body;

    // Find customer by user ID
    const customer = await Customer.findOne({ user: userId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    // Update customer fields
    if (full_name !== undefined) customer.full_name = full_name;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;

    await customer.save();

    // Get updated user info
    const user = await User.findById(userId).select('-password');

    // Return merged response
    const responseUser = {
      _id: user._id,
      email: user.email,
      username: user.username,
      full_name: customer.full_name,
      phone: customer.phone,
      address: customer.address,
      role: user.role,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: responseUser
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};
