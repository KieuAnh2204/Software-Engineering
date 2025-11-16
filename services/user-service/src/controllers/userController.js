import Customer from '../models/Customer.js';
import RestaurantOwner from '../models/RestaurantOwner.js';

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
