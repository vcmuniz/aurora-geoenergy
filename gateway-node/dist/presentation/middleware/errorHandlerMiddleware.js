"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlerMiddleware = errorHandlerMiddleware;
const exceptions_1 = require("@domain/exceptions");
const logger_1 = require("@core/logger");
const utils_1 = require("@core/utils");
function errorHandlerMiddleware(err, req, res, next) {
    const requestId = req.context?.requestId || 'unknown';
    if (err instanceof exceptions_1.DomainException) {
        logger_1.logger.warn({ requestId, code: err.code, status: err.statusCode }, `Domain exception: ${err.message}`);
        return res.status(err.statusCode).json((0, utils_1.formatResponse)(false, undefined, err.message, err.code, requestId));
    }
    logger_1.logger.error({ requestId, error: err.message, stack: err.stack }, 'Unhandled error');
    res.status(500).json((0, utils_1.formatResponse)(false, undefined, 'Internal server error', 'INTERNAL_SERVER_ERROR', requestId));
}
