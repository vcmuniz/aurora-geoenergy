"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
const uuid_1 = require("uuid");
const utils_1 = require("../../core/utils");
const logger_1 = require("../../core/logger");
function requestIdMiddleware(req, res, next) {
    const requestId = (0, uuid_1.v4)();
    req.context = (0, utils_1.createRequestContext)(requestId);
    res.setHeader('X-Request-ID', requestId);
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.info({
            requestId,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: duration,
        }, `${req.method} ${req.path} - ${res.statusCode}`);
    });
    next();
}
