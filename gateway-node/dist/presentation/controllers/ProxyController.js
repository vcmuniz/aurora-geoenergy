"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyController = void 0;
const logger_1 = require("../../core/logger");
const utils_1 = require("../../core/utils");
class ProxyController {
    constructor(backendClient) {
        this.backendClient = backendClient;
    }
    async forward(req, res) {
        try {
            const targetPath = req.path.replace(/^\/api/, '');
            const method = req.method.toUpperCase();
            const response = await this.backendClient[method.toLowerCase()](targetPath, ['GET', 'HEAD', 'DELETE'].includes(method) ? undefined : req.body, req.context.requestId);
            // Backend retorna resposta formatada, passar através com requestId/timestamp do gateway
            const backendResponse = response.data;
            res.status(response.status).json({
                ...backendResponse,
                requestId: req.context.requestId,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            // BackendException é lançada com statusCode, passar error do backend
            const statusCode = error.statusCode || 500;
            const errorMessage = error.message || 'Backend error';
            logger_1.logger.warn({ requestId: req.context.requestId, statusCode, errorMessage }, 'Backend error caught');
            res.status(statusCode).json((0, utils_1.formatResponse)(false, undefined, errorMessage, error.code || 'BACKEND_ERROR', req.context.requestId));
        }
    }
}
exports.ProxyController = ProxyController;
