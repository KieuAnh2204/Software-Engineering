const Restaurant = require('../models/Restaurant');

exports.createRestaurant = async (req, res) => {
  try {
    const ownerId = req.body.owner_id || (req.user && req.user.id);
    if (!ownerId) {
      return res.status(400).json({ success: false, message: 'owner_id is required' });
    }

    const { name, description, phone, address, logo_url, open_time, close_time } = req.body;
    if (!name || !phone || !address) {
      return res.status(400).json({ success: false, message: 'name, phone and address are required' });
    }

    const restaurant = await Restaurant.create({
      owner_id: ownerId,
      name,
      description: description || '',
      phone,
      address,
      logo_url: logo_url || null,
      open_time: open_time || null,
      close_time: close_time || null,
      // New restaurants must be approved by admin before going active
      is_active: false,
      is_blocked: req.body.is_blocked !== undefined ? req.body.is_blocked : false
    });

    res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.getRestaurants = async (req, res) => {
  try {
    const { owner_id, is_active, is_blocked } = req.query;
    const query = {};
    if (owner_id) query.owner_id = owner_id;
    if (is_active !== undefined) query.is_active = is_active === 'true';
    if (is_blocked !== undefined) query.is_blocked = is_blocked === 'true';

    const restaurants = await Restaurant.find(query).sort({ created_at: -1 });
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    if (req.user && req.user.role === 'owner' && restaurant.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Cannot modify another owner restaurant' });
    }

    const fields = ['name', 'description', 'phone', 'address', 'logo_url', 'open_time', 'close_time', 'is_active', 'is_blocked'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        restaurant[field] = req.body[field];
      }
    });

    await restaurant.save();
    res.status(200).json({ success: true, message: 'Restaurant updated', data: restaurant });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.updateRestaurantStatus = async (req, res) => {
  try {
    const { is_active, is_blocked } = req.body;
    if (is_active === undefined && is_blocked === undefined) {
      return res.status(400).json({ success: false, message: 'No status fields provided' });
    }

    const updates = {};
    if (is_active !== undefined) updates.is_active = is_active;
    if (is_blocked !== undefined) updates.is_blocked = is_blocked;

    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    res.status(200).json({ success: true, message: 'Status updated', data: restaurant });
  } catch (error) {
    console.error('Update restaurant status error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    await restaurant.deleteOne();
    res.status(200).json({ success: true, message: 'Restaurant removed' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
