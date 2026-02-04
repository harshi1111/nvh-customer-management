import sequelize from '../config/postgres';
import User from '../models/User';

async function createAdmin() {
  try {
    await sequelize.sync();
    const admin = await User.create({
      username: 'admin',
      email: 'admin@nvh.com',
      password: 'admin123', // Change this!
      role: 'admin',
      isActive: true
    });
    console.log('✅ Admin user created:', admin.username);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();