"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
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
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
// Session middleware (for family authentication)
app.use((0, express_session_1.default)({
    secret: process.env.JWT_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));
// Logging
app.use((0, morgan_1.default)('dev'));
// Body parsing
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Public routes (no authentication needed)
app.use('/api/auth', auth_routes_1.default);
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'NVH Agri System Backend'
    });
});
// Protected routes (require authentication)
app.use('/api/customers', auth_1.authenticate, customer_routes_1.default);
app.use('/api/projects', auth_1.authenticate, project_routes_1.default);
app.use('/api/transactions', auth_1.authenticate, transaction_routes_1.default);
// Admin only route example (if needed later)
// app.use('/api/admin', authenticate, authorize('admin'), adminRoutes);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(error.status || 500).json({
        error: error.message || 'Internal server error'
    });
});
exports.default = app;
