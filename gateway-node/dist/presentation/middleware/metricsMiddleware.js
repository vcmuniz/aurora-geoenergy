"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsMiddleware = metricsMiddleware;
exports.getMetrics = getMetrics;
const metrics = new Map();
function metricsMiddleware(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const key = `${req.method} ${req.route?.path || req.path}`;
        const existing = metrics.get(key) || { count: 0, totalDurationMs: 0, lastRequestAt: '' };
        metrics.set(key, {
            count: existing.count + 1,
            totalDurationMs: existing.totalDurationMs + duration,
            lastRequestAt: new Date().toISOString(),
        });
    });
    next();
}
function getMetrics() {
    const result = {};
    metrics.forEach((value, key) => {
        result[key] = {
            ...value,
            avgDurationMs: Math.round(value.totalDurationMs / value.count),
        };
    });
    return result;
}
