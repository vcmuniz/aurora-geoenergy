"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const config_1 = require("@core/config");
const logger_1 = require("@core/logger");
const requestIdMiddleware_1 = require("@presentation/middleware/requestIdMiddleware");
const authMiddleware_1 = require("@presentation/middleware/authMiddleware");
const rateLimitMiddleware_1 = require("@presentation/middleware/rateLimitMiddleware");
const errorHandlerMiddleware_1 = require("@presentation/middleware/errorHandlerMiddleware");
const healthRoutes_1 = require("@presentation/routes/healthRoutes");
const authRoutes_1 = require("@presentation/routes/authRoutes");
const promotionRoutes_1 = require("@presentation/routes/promotionRoutes");
const proxyRoutes_1 = require("@presentation/routes/proxyRoutes");
const AxiosBackendClient_1 = require("@infrastructure/http/AxiosBackendClient");
const app = (0, express_1.default)();
try {
    const config = (0, config_1.getConfig)();
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
    app.use(requestIdMiddleware_1.requestIdMiddleware);
    app.use(rateLimitMiddleware_1.rateLimitByIp);
    const backendClient = new AxiosBackendClient_1.AxiosBackendClient(config.backendUrl);
    app.use((0, healthRoutes_1.createHealthRoutes)());
    app.use(authMiddleware_1.authMiddleware);
    app.use(rateLimitMiddleware_1.rateLimitByUser);
    app.use((0, authRoutes_1.createAuthRoutes)(backendClient));
    app.use((0, promotionRoutes_1.createPromotionRoutes)(backendClient));
    app.use('/api', (0, proxyRoutes_1.createProxyRoutes)(backendClient));
    app.use(errorHandlerMiddleware_1.errorHandlerMiddleware);
    const server = app.listen(config.port, () => {
        logger_1.logger.info({ port: config.port }, `API Gateway running on port ${config.port}`);
        logger_1.logger.info({ backendUrl: config.backendUrl }, `Backend URL: ${config.backendUrl}`);
    });
    process.on('SIGTERM', () => {
        logger_1.logger.info('SIGTERM received, shutting down gracefully');
        server.close(() => {
            logger_1.logger.info('Server closed');
            process.exit(0);
        });
    });
    process.on('SIGINT', () => {
        logger_1.logger.info('SIGINT received, shutting down gracefully');
        server.close(() => {
            logger_1.logger.info('Server closed');
            process.exit(0);
        });
    });
}
catch (error) {
    logger_1.logger.error({ error }, 'Failed to start application');
    process.exit(1);
}
