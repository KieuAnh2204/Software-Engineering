import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Drop invalid indexes from customers collection if exists
    try {
      const db = conn.connection.db;
      const collections = await db.listCollections({ name: 'customers' }).toArray();
      if (collections.length > 0) {
        const indexes = await db.collection('customers').indexes();
        
        // Drop email_1 index if exists
        const emailIndex = indexes.find(idx => idx.name === 'email_1');
        if (emailIndex) {
          await db.collection('customers').dropIndex('email_1');
          console.log('✅ Dropped invalid email_1 index from customers collection');
        }
        
        // Drop username_1 index if exists
        const usernameIndex = indexes.find(idx => idx.name === 'username_1');
        if (usernameIndex) {
          await db.collection('customers').dropIndex('username_1');
          console.log('✅ Dropped invalid username_1 index from customers collection');
        }
      }
    } catch (indexError) {
      // Ignore if index doesn't exist
      console.log('ℹ️ No invalid indexes to drop');
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
