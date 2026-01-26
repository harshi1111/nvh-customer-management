"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
// OPTIONS HANDLER MUST BE FIRST - BEFORE ANYTHING ELSE
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://nvh-customer-management.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.sendStatus(200);
});
// Now import everything else
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_session_1 = __importDefault(require("express-session"));
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
// Import middleware
const auth_1 = require("./middleware/auth");
const corsConfig_1 = require("./utils/corsConfig");
// 2. Apply CORS middleware with professional config
app.use((0, cors_1.default)(corsConfig_1.corsOptions));
// 3. Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
        },
    },
}));
// Session middleware
app.use((0, express_session_1.default)({
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));
// Logging
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Public routes
app.use('/api/auth', auth_routes_1.default);
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'NVH Agri System Backend',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
    });
});
// Protected routes
app.use('/api/customers', customer_routes_1.default);
app.use('/api/projects', auth_1.authenticate, project_routes_1.default);
app.use('/api/transactions', auth_1.authenticate, transaction_routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});
// Error handler
app.use((error, req, res, next) => {
    console.error('Server Error:', {
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
    });
    // Handle CORS errors
    if (error.message === 'Not allowed by CORS') {
        return (0, corsConfig_1.handleCorsError)(req, res, error);
    }
    // Set CORS headers for all errors
    const origin = req.headers.origin;
    if (origin && origin.includes('nvh-customer-management')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // Return appropriate error response
    const status = error.statusCode || error.status || 500;
    const message = process.env.NODE_ENV === 'production' && status === 500
        ? 'Internal server error'
        : error.message;
    res.status(status).json({
        error: message,
        status,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
});
exports.default = app;
