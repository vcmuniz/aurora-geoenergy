"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../core/config");
const utils_1 = require("../../core/utils");
const logger_1 = require("../../core/logger");
const utils_2 = require("../../core/utils");
const PUBLIC_ROUTES = ['/health', '/api/health', '/api/auth/login', '/api/auth/me'];
function authMiddleware(req, res, next) {
    if (PUBLIC_ROUTES.includes(req.path)) {
        return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        logger_1.logger.warn({ requestId: req.context.requestId, path: req.path }, 'Missing Authorization header');
        return res.status(401).json((0, utils_2.formatErrorResponse)('AUTH_MISSING_TOKEN', 'Missing or invalid Authorization header', undefined, req.context.requestId));
    }
    const token = authHeader.substring(7);
    const config = (0, config_1.getConfig)();
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config.jwtSecret, {
            algorithms: [config.jwtAlgorithm],
        });
        req.context = (0, utils_1.addUserToContext)(req.context, {
            id: decoded.sub || decoded.id,
            email: decoded.email,
            role: decoded.role,
        });
        next();
    }
    catch (error) {
        logger_1.logger.warn({ requestId: req.context.requestId, error: error.message }, 'Invalid JWT token');
        res.status(401).json((0, utils_2.formatErrorResponse)('AUTH_INVALID_TOKEN', 'Invalid or expired token', undefined, req.context.requestId));
    }
}
