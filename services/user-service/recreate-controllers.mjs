import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Recreating clean controllers...\n');

// userController.js
const userController = `import Customer from '../models/Customer.js';
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
`;

// brandController.js
const brandController = `import RestaurantBrand from '../models/RestaurantBrand.js';
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
      message: \`Brand \${status.toLowerCase()} successfully\`,
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
`;

// Write files
try {
  fs.writeFileSync(path.join(__dirname, 'src/controllers/userController.js'), userController, 'utf8');
  console.log('✓ userController.js created');
  
  fs.writeFileSync(path.join(__dirname, 'src/controllers/brandController.js'), brandController, 'utf8');
  console.log('✓ brandController.js created');
  
  console.log('\n✅ All files recreated successfully!');
  console.log('\nNext step: docker-compose build user-service && docker-compose up -d user-service');
} catch (error) {
  console.error('Error creating files:', error);
  process.exit(1);
}
