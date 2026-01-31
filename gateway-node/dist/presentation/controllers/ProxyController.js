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
            // Construir path com query string
            const pathWithQuery = Object.keys(req.query).length > 0
                ? `${targetPath}?${new URLSearchParams(req.query).toString()}`
                : targetPath;
            // Extrair headers relevantes da requisição original
            const forwardedHeaders = {};
            if (req.headers.authorization) {
                forwardedHeaders.authorization = req.headers.authorization;
            }
            let response;
            if (method === 'GET' || method === 'HEAD' || method === 'DELETE') {
                response = await this.backendClient[method.toLowerCase()](pathWithQuery, req.context.requestId, forwardedHeaders);
            }
            else {
                response = await this.backendClient[method.toLowerCase()](pathWithQuery, req.body, req.context.requestId, forwardedHeaders);
            }
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
