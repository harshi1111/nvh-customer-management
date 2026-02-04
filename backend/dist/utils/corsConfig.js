"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCorsError = exports.corsOptions = exports.getCorsOrigins = void 0;
const getCorsOrigins = () => {
    const origins = [];
    // Production frontend URL
    if (process.env.PRODUCTION_FRONTEND_URL) {
        origins.push(process.env.PRODUCTION_FRONTEND_URL);
    }
    else {
        origins.push('https://nvh-customer-management.vercel.app');
    }
    // Backend URL
    if (process.env.BACKEND_URL) {
        origins.push(process.env.BACKEND_URL);
    }
    else {
        origins.push('https://nvh-customer-management.vercel.app');
    }
    // Development URLs
    if (process.env.NODE_ENV !== 'production') {
        origins.push('http://localhost:3000');
        origins.push('http://localhost:5173');
    }
    // Add any custom origins from env
    if (process.env.CORS_ORIGINS) {
        const customOrigins = process.env.CORS_ORIGINS.split(',');
        origins.push(...customOrigins.map(url => url.trim()));
    }
    return Array.from(new Set(origins.filter(Boolean))); // Remove duplicates and empty values
};
exports.getCorsOrigins = getCorsOrigins;
exports.corsOptions = {
    origin: (0, exports.getCorsOrigins)(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400
};
const handleCorsError = (req, res, error) => {
    const origin = req.headers.origin;
    // Set CORS headers even for errors
    if (origin && origin.includes('nvh-customer-management') && origin.endsWith('.vercel.app')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(403).json({
        error: 'CORS Error',
        message: 'Origin not allowed',
        suggestion: 'Ensure your frontend URL is a valid Vercel deployment'
    });
};
exports.handleCorsError = handleCorsError;
