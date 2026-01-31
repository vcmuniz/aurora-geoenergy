"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = createAuthRoutes;
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
function createAuthRoutes(backendClient) {
    const router = (0, express_1.Router)();
    const authController = new AuthController_1.AuthController(new (require('@application/usecases/AuthUseCase').AuthUseCase)(backendClient));
    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     summary: Fazer login
     *     description: Autentica o usuário com email e senha
     *     tags:
     *       - Authentication
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginRequest'
     *     responses:
     *       200:
     *         description: Login bem-sucedido
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/LoginResponse'
     *       401:
     *         description: Credenciais inválidas
     */
    router.post('/api/auth/login', (req, res, next) => authController.login(req, res, next));
    /**
     * @swagger
     * /api/auth/me:
     *   get:
     *     summary: Obter perfil do usuário
     *     description: Retorna informações do usuário autenticado
     *     tags:
     *       - Authentication
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Perfil do usuário
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserProfile'
     *       401:
     *         description: Não autenticado
     */
    router.get('/api/auth/me', (req, res, next) => authController.getMe(req, res, next));
    return router;
}
