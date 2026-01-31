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
        // Backend retorna ApiResponse, então response.data é o ApiResponse completo
        // Precisamos extrair o .data interno
        const apiResponse = response.data;
        return apiResponse.data || apiResponse;
    }
    async getMe(context, authHeader) {
        logger_1.logger.info({ requestId: context.requestId, userId: context.user?.id }, 'Executing get me use case');
        const headers = {};
        if (authHeader) {
            headers.Authorization = authHeader;
        }
        const response = await this.backendClient.get('/auth/me', context.requestId, headers);
        // Backend retorna ApiResponse, então response.data é o ApiResponse completo
        const apiResponse = response.data;
        return apiResponse.data || apiResponse;
    }
}
exports.AuthUseCase = AuthUseCase;
