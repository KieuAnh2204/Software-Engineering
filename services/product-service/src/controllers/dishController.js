const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');

const buildImageUrl = (req, filename) => {
  const baseUrl = (process.env.PRODUCT_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  return `${baseUrl}/uploads/dishes/${filename}`;
};

exports.uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const imageUrl = buildImageUrl(req, req.file.filename);
    return res.status(201).json({ success: true, image_url: imageUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Upload image error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.createDish = async (req, res) => {
  try {
    const { restaurant_id, name, description, price, image_url, is_available } = req.body;
    if (!restaurant_id || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'restaurant_id, name and price are required' });
    }

    const restaurant = await Restaurant.findById(restaurant_id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    
    // Temporarily disable owner check for testing
    // if (req.user && req.user.role === 'owner' && restaurant.owner_id !== req.user.id) {
    //   return res.status(403).json({ success: false, message: 'Cannot manage dishes for another owner' });
    // }

    // Kiểm tra món trùng lặp (cùng restaurant_id và name)
    const existingDish = await Dish.findOne({ 
      restaurant_id, 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } // Case-insensitive
    });
    
    if (existingDish) {
      return res.status(409).json({ 
        success: false, 
        message: 'Món ăn này đã tồn tại trong nhà hàng',
        duplicate: true 
      });
    }

    // Prefer uploaded file over provided image_url
    let finalImageUrl = image_url || null;
    if (req.file) {
      finalImageUrl = buildImageUrl(req, req.file.filename);
    }

    const dish = await Dish.create({
      restaurant_id,
      name: name.trim(),
      description: description || '',
      price,
      image_url: finalImageUrl,
      is_available: is_available !== undefined ? is_available : true
    });

    res.status(201).json({ success: true, data: dish });
  } catch (error) {
    console.error('Create dish error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.getDishes = async (req, res) => {
  try {
    const { restaurant_id, is_available } = req.query;
    const query = {};
    if (restaurant_id) query.restaurant_id = restaurant_id;
    if (is_available !== undefined) query.is_available = is_available === 'true';

    const dishes = await Dish.find(query).sort({ created_at: -1 });
    res.status(200).json({ success: true, count: dishes.length, data: dishes });
  } catch (error) {
    console.error('Get dishes error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.getDishById = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) return res.status(404).json({ success: false, message: 'Dish not found' });
    res.status(200).json({ success: true, data: dish });
  } catch (error) {
    console.error('Get dish error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.updateDish = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) return res.status(404).json({ success: false, message: 'Dish not found' });

    const restaurant = await Restaurant.findById(dish.restaurant_id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Parent restaurant not found' });
    if (req.user && req.user.role === 'owner' && restaurant.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Cannot modify dishes for another owner' });
    }

    const fields = ['name', 'description', 'price', 'image_url', 'is_available'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        dish[field] = req.body[field];
      }
    });

    // If new file uploaded, override image_url
    if (req.file) {
      dish.image_url = buildImageUrl(req, req.file.filename);
    }

    await dish.save();
    res.status(200).json({ success: true, message: 'Dish updated', data: dish });
  } catch (error) {
    console.error('Update dish error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.deleteDish = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) return res.status(404).json({ success: false, message: 'Dish not found' });

    const restaurant = await Restaurant.findById(dish.restaurant_id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Parent restaurant not found' });
    if (req.user && req.user.role === 'owner' && restaurant.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Cannot delete dishes for another owner' });
    }

    await dish.deleteOne();
    res.status(200).json({ success: true, message: 'Dish deleted' });
  } catch (error) {
    console.error('Delete dish error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
