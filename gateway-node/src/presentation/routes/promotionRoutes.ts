import { Router, Request, Response } from 'express';
import { PromotionController } from '../controllers/PromotionController';
import { IBackendClient } from '@infrastructure/http/IBackendClient';

export function createPromotionRoutes(backendClient: IBackendClient): Router {
  const router = Router();
  const promotionController = new PromotionController(new (require('@application/usecases/PromotionUseCase').PromotionUseCase)(backendClient));

  router.post('/internal/promotions/validate-production', (req: Request, res: Response) =>
    promotionController.validateProductionPromotion(req, res).catch((err) => {
      throw err;
    })
  );

  return router;
}
