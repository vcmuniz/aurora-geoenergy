"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestContext = createRequestContext;
exports.addUserToContext = addUserToContext;
exports.formatSuccessResponse = formatSuccessResponse;
exports.formatErrorResponse = formatErrorResponse;
exports.formatResponse = formatResponse;
function createRequestContext(requestId) {
    return {
        requestId,
        timestamp: new Date(),
    };
}
function addUserToContext(context, user) {
    return {
        ...context,
        user,
    };
}
function formatSuccessResponse(data, requestId) {
    return {
        success: true,
        data,
        requestId,
        timestamp: new Date().toISOString(),
    };
}
function formatErrorResponse(code, message, details, requestId) {
    return {
        success: false,
        error: {
            code,
            message,
            ...(details && { details }),
        },
        requestId: requestId || 'unknown',
        timestamp: new Date().toISOString(),
    };
}
// Compatibilidade com código antigo
function formatResponse(success, data, error, code, requestId) {
    if (success && data) {
        return formatSuccessResponse(data, requestId);
    }
    else {
        return formatErrorResponse(code || 'UNKNOWN_ERROR', error || 'Unknown error', undefined, requestId);
    }
}
