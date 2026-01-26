"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const postgres_1 = require("./config/postgres"); // NEW POSTGRES CONNECTION
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 5000;
// Connect to PostgreSQL (Supabase)
(0, postgres_1.connectPostgres)()
    .then(() => {
    // Start server
    app_1.default.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
})
    .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
});
