import dotenv from 'dotenv';
dotenv.config();

import { connectPostgres } from './config/postgres'; // NEW POSTGRES CONNECTION
import app from './app';

const PORT = process.env.PORT || 5000;

// Connect to PostgreSQL (Supabase)
connectPostgres()
  .then(() => {
    // Start server
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