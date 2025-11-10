const Product = require('../models/Product');

// CREATE
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, restaurantId, image, available, preparationTime } = req.body;

    if (!name || !description || price === undefined || !category || !restaurantId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      restaurantId,
      image,
      available,
      preparationTime
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// LIST with optional filters
exports.getProducts = async (req, res) => {
  try {
    const { restaurantId, category, available } = req.query;
    const query = {};
    if (restaurantId) query.restaurantId = restaurantId;
    if (category) query.category = category;
    if (available !== undefined) query.available = available === 'true';

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// DETAIL
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// UPDATE
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const fields = ['name','description','price','category','image','available','preparationTime'];
    fields.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f]; });

    await product.save();
    res.status(200).json({ success: true, message: 'Product updated', data: product });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// DELETE
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    await product.deleteOne();
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};