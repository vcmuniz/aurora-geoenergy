import { Router, Request, Response } from 'express';
import { PromotionController } from '../controllers/PromotionController';
import { IBackendClient } from '@infrastructure/http/IBackendClient';

export function createPromotionRoutes(backendClient: IBackendClient): Router {
  const router = Router();
  const promotionController = new PromotionController(new (require('@application/usecases/PromotionUseCase').PromotionUseCase)(backendClient));

  /**
   * @swagger
   * /internal/promotions/validate-production:
   *   post:
   *     summary: Validar promoção para PROD
   *     description: Valida se um release pode ser promovido para PROD conforme policy
   *     tags:
   *       - Promotions
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               releaseId:
   *                 type: string
   *               fromEnv:
   *                 type: string
   *                 enum: [PRE_PROD]
   *               toEnv:
   *                 type: string
   *                 enum: [PROD]
   *     responses:
   *       200:
   *         description: Validação realizada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 allowed:
   *                   type: boolean
   *                 reason:
   *                   type: string
   *       400:
   *         description: Dados inválidos
   */
  router.post('/internal/promotions/validate-production', (req: Request, res: Response) =>
    promotionController.validateProductionPromotion(req, res).catch((err) => {
      throw err;
    })
  );

  return router;
}
