"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectPostgres = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const dotenv_1 = __importDefault(require("dotenv"));
// 🔥 IMPORT ALL YOUR MODELS HERE
const Customer_1 = __importDefault(require("../models/Customer"));
const Project_1 = __importDefault(require("../models/Project"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const sequelize = new sequelize_typescript_1.Sequelize({
    database: process.env.DB_NAME || 'postgres',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    // 🔥 REPLACE THE PATH WITH EXPLICIT MODEL IMPORTS
    models: [Customer_1.default, Project_1.default, Transaction_1.default, User_1.default], // <-- CHANGE THIS LINE
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});
const connectPostgres = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL Connected Successfully');
        // Sync models (create tables if they don't exist)
        await sequelize.sync({ alter: true });
        console.log('✅ PostgreSQL tables synced');
    }
    catch (error) {
        console.error('❌ PostgreSQL Connection Error:', error);
        process.exit(1);
    }
};
exports.connectPostgres = connectPostgres;
exports.default = sequelize;
