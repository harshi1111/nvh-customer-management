import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const setupAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nvh_agri_db');
    console.log('Connected to MongoDB');

    // Check if admin user exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      password: 'family123', // Change this!
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: family123');
    console.log('\n⚠️ IMPORTANT: Change password immediately after first login!');

  } catch (error) {
    console.error('Setup error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run setup
setupAdmin();