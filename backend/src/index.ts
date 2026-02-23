import dotenv from 'dotenv';
dotenv.config();

import { connectPostgres } from './config/postgres'; // NEW POSTGRES CONNECTION
import app from './app';
import User from './models/User';

const PORT = process.env.PORT || 5000;

// Connect to PostgreSQL (Supabase)
connectPostgres()
  .then(async () => {
    // AUTO-SEED: Ensure at least one admin exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@nvh.com',
        password: 'admin123', // Tell your dad to change this after first login!
        role: 'admin',
        isActive: true
      });
      console.log('👤 Initial Admin Seeded: admin / admin123');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });