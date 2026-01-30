import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';

// 🔥 IMPORT ALL YOUR MODELS HERE
import Customer from '../models/Customer';
import Project from '../models/Project';
import Transaction from '../models/Transaction';
import User from '../models/User';

dotenv.config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'postgres',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  dialect: 'postgres',
  // 🔥 REPLACE THE PATH WITH EXPLICIT MODEL IMPORTS
  models: [Customer, Project, Transaction, User], // <-- CHANGE THIS LINE
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

export const connectPostgres = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected Successfully');
    
    // Sync models (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ PostgreSQL tables synced');
    
  } catch (error) {
    console.error('❌ PostgreSQL Connection Error:', error);
    process.exit(1);
  }
};

export default sequelize;