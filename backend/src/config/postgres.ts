import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';

// Import models
import Customer from '../models/Customer';
import Project from '../models/Project';
import Transaction from '../models/Transaction';
import User from '../models/User';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const sequelize = connectionString 
  ? new Sequelize(connectionString, {
      dialect: 'postgres',
      models: [Customer, Project, Transaction, User],
      logging: !isProduction,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
      }
    })
  : new Sequelize({
      database: process.env.DB_NAME || 'postgres',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      dialect: 'postgres',
      models: [Customer, Project, Transaction, User],
      logging: !isProduction,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
      }
    });

// 🔥 CRITICAL: Initialize models globally
// This ensures when controllers import models, they're already connected
sequelize.addModels([Customer, Project, Transaction, User]);

export const connectPostgres = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected Successfully');
    
    // Sync models
    await sequelize.sync({ alter: true });
    console.log('✅ PostgreSQL tables synced');
    
  } catch (error) {
    console.error('❌ PostgreSQL Connection Error:', error);
    process.exit(1);
  }
};

export default sequelize;