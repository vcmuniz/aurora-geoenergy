import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/AuthController';
import { IBackendClient } from '@infrastructure/http/IBackendClient';

export function createAuthRoutes(backendClient: IBackendClient): Router {
  const router = Router();
  const authController = new AuthController(new (require('@application/usecases/AuthUseCase').AuthUseCase)(backendClient));

  router.post('/api/auth/login', (req: Request, res: Response) =>
    authController.login(req, res).catch((err) => {
      throw err;
    })
  );

  router.get('/api/auth/me', (req: Request, res: Response) =>
    authController.getMe(req, res).catch((err) => {
      throw err;
    })
  );

  return router;
}
