"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("../config/postgres"));
const User_1 = __importDefault(require("../models/User"));
async function createAdmin() {
    try {
        await postgres_1.default.sync();
        const admin = await User_1.default.create({
            username: 'admin',
            email: 'admin@nvh.com',
            password: 'admin123', // Change this!
            role: 'admin',
            isActive: true
        });
        console.log('✅ Admin user created:', admin.username);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
}
createAdmin();
