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
            if (response.status >= 200 && response.status < 300) {
                // Backend já retorna resposta formatada, apenas passar através
                const backendResponse = response.data;
                res.status(response.status).json({
                    ...backendResponse,
                    requestId: req.context.requestId,
                    timestamp: new Date().toISOString()
                });
            }
            else {
                res.status(response.status).json((0, utils_1.formatResponse)(false, undefined, response.data?.error || response.data?.message || 'Request failed', response.data?.code || 'REQUEST_ERROR', req.context.requestId));
            }
        }
        catch (error) {
            logger_1.logger.error({ requestId: req.context.requestId, error: error.message }, 'Proxy request failed');
            throw error;
        }
    }
}
exports.ProxyController = ProxyController;
