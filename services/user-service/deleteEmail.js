import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const deleteEmail = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const email = 'BunRieuCuaCoTuyet@gmail.com';
    
    // Find user
    const user = await db.collection('users').findOne({ email });
    console.log('Found user:', user);
    
    if (user) {
      // Delete from restaurantowners if exists
      await db.collection('restaurantowners').deleteMany({ user: user._id });
      console.log('Deleted from restaurantowners');
      
      // Delete from users
      await db.collection('users').deleteOne({ email });
      console.log('Deleted from users');
      
      console.log(`✅ Deleted email: ${email}`);
    } else {
      console.log('❌ Email not found');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

deleteEmail();
