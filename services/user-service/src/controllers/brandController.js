import RestaurantBrand from '../models/RestaurantBrand.js';
import Restaurant from '../models/Restaurant.js';

export const getAllBrands = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = {};
    if (status) {
      query.status = status;
    }

    const brands = await RestaurantBrand.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await RestaurantBrand.countDocuments(query);

    res.json({
      success: true,
      data: brands,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error getting brands:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving brands',
      error: error.message
    });
  }
};

export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await RestaurantBrand.findById(id).select('-password');

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    const restaurants = await Restaurant.find({ brand_id: id });

    res.json({
      success: true,
      data: {
        ...brand.toObject(),
        restaurants
      }
    });
  } catch (error) {
    console.error('Error getting brand:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving brand',
      error: error.message
    });
  }
};
