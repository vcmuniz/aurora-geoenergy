"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.getConfig = getConfig;
function loadConfig() {
    const requiredVars = ['JWT_SECRET', 'BACKEND_URL'];
    const missing = requiredVars.filter((v) => !process.env[v]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    return {
        port: parseInt(process.env.PORT || '3000', 10),
        backendUrl: process.env.BACKEND_URL,
        jwtSecret: process.env.JWT_SECRET,
        jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
        logLevel: process.env.LOG_LEVEL || 'info',
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        rateLimitMaxAuth: parseInt(process.env.RATE_LIMIT_MAX_AUTH_REQUESTS || '1000', 10),
        nodeEnv: process.env.NODE_ENV || 'development',
    };
}
let configInstance = null;
function getConfig() {
    if (!configInstance) {
        configInstance = loadConfig();
    }
    return configInstance;
}
