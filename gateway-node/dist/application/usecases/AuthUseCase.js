"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUseCase = void 0;
const logger_1 = require("@core/logger");
class AuthUseCase {
    constructor(backendClient) {
        this.backendClient = backendClient;
    }
    async login(email, password, context) {
        logger_1.logger.info({ requestId: context.requestId, email }, 'Executing login use case');
        const response = await this.backendClient.post('/auth/login', { email, password }, context.requestId);
        return response.data;
    }
    async getMe(context) {
        logger_1.logger.info({ requestId: context.requestId, userId: context.user?.id }, 'Executing get me use case');
        const response = await this.backendClient.get('/auth/me', context.requestId);
        return response.data;
    }
}
exports.AuthUseCase = AuthUseCase;
