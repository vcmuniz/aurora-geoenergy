"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const logger_1 = require("../../core/logger");
const utils_1 = require("../../core/utils");
class AuthController {
    constructor(authUseCase) {
        this.authUseCase = authUseCase;
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json((0, utils_1.formatResponse)(false, undefined, 'Email and password required', 'VALIDATION_ERROR', req.context.requestId));
            }
            const result = await this.authUseCase.login(email, password, req.context);
            res.status(200).json((0, utils_1.formatResponse)(true, result, undefined, undefined, req.context.requestId));
        }
        catch (error) {
            logger_1.logger.error({ requestId: req.context.requestId, error: error.message }, 'Login failed');
            throw error;
        }
    }
    async getMe(req, res) {
        try {
            const result = await this.authUseCase.getMe(req.context);
            res.status(200).json((0, utils_1.formatResponse)(true, result, undefined, undefined, req.context.requestId));
        }
        catch (error) {
            logger_1.logger.error({ requestId: req.context.requestId, error: error.message }, 'Get me failed');
            throw error;
        }
    }
}
exports.AuthController = AuthController;
