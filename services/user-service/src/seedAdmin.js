import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import Admin from './models/Admin.js';

dotenv.config();

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB!');

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Super Admin already exists:', existingAdmin.email);
      return process.exit();
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const user = await User.create({
      email: 'admin@foodfast.com',
      username: 'superadmin',
      password: hashedPassword,
      role: 'admin'
    });

    await Admin.create({
      user: user._id
    });

    console.log(' Super Admin created successfully!');
  } catch (err) {
    console.error(' Error creating Super Admin:', err);
  } finally {
    process.exit();
  }
}

createSuperAdmin();
