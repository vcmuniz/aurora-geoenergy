"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthRoutes = createHealthRoutes;
const express_1 = require("express");
const utils_1 = require("../../core/utils");
const metricsMiddleware_1 = require("../middleware/metricsMiddleware");
function createHealthRoutes() {
    const router = (0, express_1.Router)();
    router.get('/health', (req, res) => {
        res.status(200).json((0, utils_1.formatResponse)(true, { status: 'ok' }, undefined, undefined, req.context.requestId));
    });
    router.get('/metrics', (req, res) => {
        res.json({
            success: true,
            data: (0, metricsMiddleware_1.getMetrics)(),
            timestamp: new Date().toISOString()
        });
    });
    return router;
}
