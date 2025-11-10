// Script to remove legacy 'role' field from existing documents in MongoDB
// Usage: node scripts/remove-legacy-roles.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.USER_SERVICE_MONGODB_URI;
if (!uri) {
  console.error('Missing MONGODB_URI or USER_SERVICE_MONGODB_URI env variable');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(uri, { });
    console.log('Connected to MongoDB');

    const customerResult = await mongoose.connection.db.collection('customers').updateMany(
      { role: { $exists: true } },
      { $unset: { role: '' } }
    );
    console.log(`Customers modified: ${customerResult.modifiedCount}`);

    const brandResult = await mongoose.connection.db.collection('restaurantbrands').updateMany(
      { role: { $exists: true } },
      { $unset: { role: '' } }
    );
    console.log(`RestaurantBrands modified: ${brandResult.modifiedCount}`);

    console.log('Legacy role fields removed successfully.');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
