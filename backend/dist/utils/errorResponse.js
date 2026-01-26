"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleControllerError = exports.createErrorResponse = exports.ErrorResponse = void 0;
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.ErrorResponse = ErrorResponse;
const createErrorResponse = (message, statusCode = 500) => {
    return {
        success: false,
        error: message,
        statusCode
    };
};
exports.createErrorResponse = createErrorResponse;
const handleControllerError = (error, res) => {
    console.error('Controller error:', error);
    // Set CORS headers for error responses
    // Rest of your error handling...
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json((0, exports.createErrorResponse)(messages.join(', '), 400));
    }
    if (error.code === 11000) {
        return res.status(400).json((0, exports.createErrorResponse)('Duplicate entry found', 400));
    }
    if (error.statusCode) {
        return res.status(error.statusCode).json((0, exports.createErrorResponse)(error.message, error.statusCode));
    }
    return res.status(500).json((0, exports.createErrorResponse)('Server error', 500));
};
exports.handleControllerError = handleControllerError;
