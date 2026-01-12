"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const setupAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nvh_agri_db');
        console.log('Connected to MongoDB');
        // Check if admin user exists
        const existingAdmin = await User_1.default.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }
        // Create admin user
        const adminUser = new User_1.default({
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
    }
    catch (error) {
        console.error('Setup error:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
};
// Run setup
setupAdmin();
