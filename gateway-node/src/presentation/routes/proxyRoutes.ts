import { Router, Request, Response } from 'express';
import { ProxyController } from '../controllers/ProxyController';
import { IBackendClient } from '@infrastructure/http/IBackendClient';

export function createProxyRoutes(backendClient: IBackendClient): Router {
  const router = Router();
  const proxyController = new ProxyController(backendClient);

  router.all('/*', (req: Request, res: Response) =>
    proxyController.forward(req, res).catch((err) => {
      throw err;
    })
  );

  return router;
}
