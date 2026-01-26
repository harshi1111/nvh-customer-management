"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const corsConfig_1 = require("../utils/corsConfig");
// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'dee4bf44403a243bed5d7adde4af3e2a4cdbbcad7d917c4f490b387986da1d5445860072893f0a39cc3566c283a712a0f001c12d87f5ef76923f6ac4dc3d6df2';
// Helper function to send error with CORS headers
const sendErrorWithCors = (req, res, status, message) => {
    const origin = req.headers.origin;
    const allowedOrigins = (0, corsConfig_1.getCorsOrigins)();
    if (origin && (allowedOrigins.includes(origin) || origin.includes('nvh-customer-management'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(status).json({ error: message });
};
// Generate JWT Token
const generateToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};
exports.generateToken = generateToken;
// Authentication middleware
const authenticate = async (req, res, next) => {
    // SKIP authentication for OPTIONS requests
    if (req.method === 'OPTIONS') {
        return next();
    }
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            sendErrorWithCors(req, res, 401, 'Authentication required');
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await User_1.default.findByPk(decoded.userId);
        if (!user || !user.isActive) {
            sendErrorWithCors(req, res, 401, 'User not found or inactive');
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        sendErrorWithCors(req, res, 401, 'Invalid token');
    }
};
exports.authenticate = authenticate;
// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            sendErrorWithCors(req, res, 401, 'Authentication required');
            return;
        }
        if (!roles.includes(req.user.role)) {
            sendErrorWithCors(req, res, 403, 'Insufficient permissions');
            return;
        }
        next();
    };
};
exports.authorize = authorize;
