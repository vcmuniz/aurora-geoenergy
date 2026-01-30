"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = createAuthRoutes;
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
function createAuthRoutes(backendClient) {
    const router = (0, express_1.Router)();
    const authController = new AuthController_1.AuthController(new (require('../../application/usecases/AuthUseCase').AuthUseCase)(backendClient));
    router.post('/api/auth/login', (req, res) => authController.login(req, res).catch((err) => {
        throw err;
    }));
    router.get('/api/auth/me', (req, res) => authController.getMe(req, res).catch((err) => {
        throw err;
    }));
    return router;
}
