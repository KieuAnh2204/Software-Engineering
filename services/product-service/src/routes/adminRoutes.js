const express = require('express');
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');

const router = express.Router();

// Clean up orphan dishes (dishes with invalid restaurant_id)
router.delete('/cleanup-orphan-dishes', async (req, res) => {
  try {
    const allDishes = await Dish.find({});
    const orphanDishes = [];

    for (const dish of allDishes) {
      const restaurant = await Restaurant.findById(dish.restaurant_id);
      if (!restaurant) {
        orphanDishes.push(dish);
      }
    }

    if (orphanDishes.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No orphan dishes found',
        count: 0 
      });
    }

    // Delete all orphan dishes
    const orphanIds = orphanDishes.map(d => d._id);
    await Dish.deleteMany({ _id: { $in: orphanIds } });

    res.json({ 
      success: true, 
      message: `Deleted ${orphanDishes.length} orphan dishes`,
      count: orphanDishes.length,
      dishes: orphanDishes.map(d => ({ id: d._id, name: d.name, restaurant_id: d.restaurant_id }))
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
