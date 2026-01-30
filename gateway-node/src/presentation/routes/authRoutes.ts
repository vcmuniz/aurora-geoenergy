import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/AuthController';
import { IBackendClient } from '@infrastructure/http/IBackendClient';

export function createAuthRoutes(backendClient: IBackendClient): Router {
  const router = Router();
  const authController = new AuthController(new (require('@application/usecases/AuthUseCase').AuthUseCase)(backendClient));

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
  router.post('/api/auth/login', (req: Request, res: Response) =>
    authController.login(req, res).catch((err) => {
      throw err;
    })
  );

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
  router.get('/api/auth/me', (req: Request, res: Response) =>
    authController.getMe(req, res).catch((err) => {
      throw err;
    })
  );

  return router;
}
