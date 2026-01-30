"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestContext = createRequestContext;
exports.addUserToContext = addUserToContext;
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
function formatResponse(success, data, error, code, requestId) {
    return {
        success,
        ...(data && { data }),
        ...(error && { error }),
        ...(code && { code }),
        requestId,
        timestamp: new Date().toISOString(),
    };
}
