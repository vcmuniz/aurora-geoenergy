"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const utils_1 = require("../../core/utils");
class AuthController {
    constructor(authUseCase) {
        this.authUseCase = authUseCase;
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json((0, utils_1.formatResponse)(false, undefined, 'Email and password required', 'VALIDATION_ERROR', req.context.requestId));
            }
            const result = await this.authUseCase.login(email, password, req.context);
            res.status(200).json((0, utils_1.formatResponse)(true, result, undefined, undefined, req.context.requestId));
        }
        catch (error) {
            next(error);
        }
    }
    async getMe(req, res, next) {
        try {
            const result = await this.authUseCase.getMe(req.context);
            res.status(200).json((0, utils_1.formatResponse)(true, result, undefined, undefined, req.context.requestId));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
