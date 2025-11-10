# Script to recreate all corrupted models and controllers

Write-Host "Creating clean models and controllers..." -ForegroundColor Green

# Create userController.js
@"
import Customer from '../models/Customer.js';
import RestaurantBrand from '../models/RestaurantBrand.js';

export const getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const customers = await Customer.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments();

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

export const getAllRestaurantBrands = async (req, res) => {
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
    console.error('Error getting restaurant brands:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving restaurant brands',
      error: error.message
    });
  }
};
"@ | Set-Content -Path "src/controllers/userController.js" -Encoding UTF8

Write-Host "✓ userController.js created" -ForegroundColor Cyan

# Create brandController.js
@"
import RestaurantBrand from '../models/RestaurantBrand.js';
import Restaurant from '../models/Restaurant.js';

export const updateBrandStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be APPROVED or REJECTED'
      });
    }

    const brand = await RestaurantBrand.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-password');

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    res.json({
      success: true,
      message: `+"`Brand $"+`{status.toLowerCase()} successfully`+"`"+`,
      data: brand
    });
  } catch (error) {
    console.error('Error updating brand status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating brand status',
      error: error.message
    });
  }
};

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
"@ | Set-Content -Path "src/controllers/brandController.js" -Encoding UTF8

Write-Host "✓ brandController.js created" -ForegroundColor Cyan

Write-Host "`nAll files recreated successfully!" -ForegroundColor Green
Write-Host "Run: docker-compose build user-service && docker-compose up -d user-service" -ForegroundColor Yellow
