const Product = require('../models/Product');
const Category = require('../models/Category');
const Image = require('../models/Image');

// ==================== PUBLIC ROUTES ====================

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res, next) => {
  try {
    const { 
      categoryId, 
      restaurantId, 
      search, 
      available,
      minPrice,
      maxPrice,
      spicyLevel,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;
    
    let query = {};
    
    // Filter by category
    if (categoryId) query.categoryId = categoryId;
    
    // Filter by restaurant
    if (restaurantId) query.restaurantId = restaurantId;
    
    // Filter by availability
    if (available !== undefined) query.available = available === 'true';
    
    // Search by name/description
    if (search) {
      query.$text = { $search: search };
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Spicy level filter
    if (spicyLevel) query.spicyLevel = parseInt(spicyLevel);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .populate('categoryId', 'name slug')
      .populate('images', 'url altText')
      .populate('mainImage', 'url altText')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name slug description')
      .populate('images', 'url altText caption isDefault')
      .populate('mainImage', 'url altText');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy món ăn'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get products by restaurant
// @route   GET /api/products/restaurant/:restaurantId
// @access  Public
exports.getProductsByRestaurant = async (req, res, next) => {
  try {
    const { categoryId, available = true } = req.query;
    
    let query = { 
      restaurantId: req.params.restaurantId,
      available: available === 'true'
    };
    
    if (categoryId) query.categoryId = categoryId;
    
    const products = await Product.find(query)
      .populate('categoryId', 'name slug')
      .populate('mainImage', 'url altText')
      .sort('categoryId displayOrder');
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
exports.searchProducts = async (req, res, next) => {
  try {
    const { q, categoryId, restaurantId, available = true } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập từ khóa tìm kiếm'
      });
    }
    
    const filters = {
      available: available === 'true',
      $text: { $search: q }
    };
    
    if (categoryId) filters.categoryId = categoryId;
    if (restaurantId) filters.restaurantId = restaurantId;
    
    const products = await Product.find(filters)
      .populate('categoryId', 'name slug')
      .populate('mainImage', 'url altText')
      .sort({ score: { $meta: 'textScore' } })
      .limit(50);
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// ==================== RESTAURANT OWNER ROUTES ====================

// @desc    Create new product (Restaurant Owner)
// @route   POST /api/products
// @access  Private (Restaurant)
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      categoryId,
      images, // Array of image IDs
      mainImage,
      ingredients,
      allergens,
      spicyLevel,
      nutritionInfo,
      preparationTime,
      available,
      displayOrder
    } = req.body;

    // Validate required fields
    if (!name || !price || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên món, giá và danh mục'
      });
    }

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Verify images exist if provided
    if (images && images.length > 0) {
      const imageCount = await Image.countDocuments({ _id: { $in: images } });
      if (imageCount !== images.length) {
        return res.status(404).json({
          success: false,
          message: 'Một số hình ảnh không tồn tại'
        });
      }
    }

    // Create product with restaurant owner's restaurantId
    const productData = {
      name,
      description,
      price,
      categoryId,
      restaurantId: req.restaurantId, // From auth middleware
      images: images || [],
      mainImage: mainImage || (images && images.length > 0 ? images[0] : null),
      ingredients: ingredients || [],
      allergens: allergens || [],
      spicyLevel: spicyLevel || 0,
      nutritionInfo: nutritionInfo || {},
      preparationTime: preparationTime || 15,
      available: available !== undefined ? available : true,
      displayOrder: displayOrder || 0
    };

    const product = await Product.create(productData);

    // Populate references before returning
    await product.populate([
      { path: 'categoryId', select: 'name slug' },
      { path: 'images', select: 'url altText' },
      { path: 'mainImage', select: 'url altText' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo món ăn thành công',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (Restaurant Owner)
// @route   PUT /api/products/:id
// @access  Private (Restaurant - Own products only)
exports.updateProduct = async (req, res, next) => {
  try {
    // Find product first
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy món ăn'
      });
    }

    // Check ownership - restaurant can only update their own products
    if (product.restaurantId.toString() !== req.restaurantId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa món ăn này'
      });
    }

    // Verify category if being updated
    if (req.body.categoryId) {
      const category = await Category.findById(req.body.categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy danh mục'
        });
      }
    }

    // Verify images if being updated
    if (req.body.images && req.body.images.length > 0) {
      const imageCount = await Image.countDocuments({ _id: { $in: req.body.images } });
      if (imageCount !== req.body.images.length) {
        return res.status(404).json({
          success: false,
          message: 'Một số hình ảnh không tồn tại'
        });
      }
    }

    // Update product
    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'categoryId', select: 'name slug' },
      { path: 'images', select: 'url altText' },
      { path: 'mainImage', select: 'url altText' }
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật món ăn thành công',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (Restaurant Owner)
// @route   DELETE /api/products/:id
// @access  Private (Restaurant - Own products only)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy món ăn'
      });
    }

    // Check ownership
    if (product.restaurantId.toString() !== req.restaurantId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa món ăn này'
      });
    }

    await product.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Xóa món ăn thành công'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my restaurant's products
// @route   GET /api/products/my-products
// @access  Private (Restaurant)
exports.getMyProducts = async (req, res, next) => {
  try {
    const { categoryId, available, page = 1, limit = 50 } = req.query;
    
    let query = { restaurantId: req.restaurantId };
    
    if (categoryId) query.categoryId = categoryId;
    if (available !== undefined) query.available = available === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .populate('categoryId', 'name slug')
      .populate('mainImage', 'url altText')
      .sort('categoryId displayOrder')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle product availability
// @route   PATCH /api/products/:id/availability
// @access  Private (Restaurant - Own products only)
exports.toggleAvailability = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy món ăn'
      });
    }

    // Check ownership
    if (product.restaurantId.toString() !== req.restaurantId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thao tác món ăn này'
      });
    }

    product.available = !product.available;
    await product.save();
    
    res.status(200).json({
      success: true,
      message: `Món ăn đã ${product.available ? 'có sẵn' : 'không có sẵn'}`,
      data: { available: product.available }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product images
// @route   PUT /api/products/:id/images
// @access  Private (Restaurant - Own products only)
exports.updateProductImages = async (req, res, next) => {
  try {
    const { images, mainImage } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy món ăn'
      });
    }

    // Check ownership
    if (product.restaurantId.toString() !== req.restaurantId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thao tác món ăn này'
      });
    }

    // Verify images exist
    if (images && images.length > 0) {
      const imageCount = await Image.countDocuments({ _id: { $in: images } });
      if (imageCount !== images.length) {
        return res.status(404).json({
          success: false,
          message: 'Một số hình ảnh không tồn tại'
        });
      }
      product.images = images;
    }

    // Set main image
    if (mainImage) {
      const imageExists = await Image.findById(mainImage);
      if (!imageExists) {
        return res.status(404).json({
          success: false,
          message: 'Hình ảnh chính không tồn tại'
        });
      }
      product.mainImage = mainImage;
    }

    await product.save();
    
    await product.populate([
      { path: 'images', select: 'url altText' },
      { path: 'mainImage', select: 'url altText' }
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật hình ảnh thành công',
      data: product
    });
  } catch (error) {
    next(error);
  }
};
