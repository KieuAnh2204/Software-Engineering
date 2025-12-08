const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const dishSchema = new mongoose.Schema({
  restaurant_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: String,
  description: String,
  price: Number,
  image_url: String,
  is_available: Boolean,
}, { collection: 'dishes' });

const restaurantSchema = new mongoose.Schema({
  owner_id: String,
  name: String,
  description: String,
  phone: String,
  address: String,
}, { collection: 'restaurants' });

const Dish = mongoose.model('Dish', dishSchema);
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

async function fixOrphanDishes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all dishes
    const allDishes = await Dish.find({});
    console.log(`Total dishes: ${allDishes.length}`);

    let fixedCount = 0;
    let orphanCount = 0;

    for (const dish of allDishes) {
      // Check if restaurant exists
      const restaurant = await Restaurant.findById(dish.restaurant_id);
      
      if (!restaurant) {
        orphanCount++;
        console.log(`\nOrphan dish found: ${dish.name} (${dish._id})`);
        console.log(`  Invalid restaurant_id: ${dish.restaurant_id}`);
        
        // Option 1: Delete orphan dishes
        // await Dish.deleteOne({ _id: dish._id });
        // console.log(`  ✓ Deleted`);
        
        // Option 2: Keep for manual review
        console.log(`  ⚠ Kept for manual review`);
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total dishes: ${allDishes.length}`);
    console.log(`Orphan dishes: ${orphanCount}`);
    console.log(`Fixed: ${fixedCount}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixOrphanDishes();
