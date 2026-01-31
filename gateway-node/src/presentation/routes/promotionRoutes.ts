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
   *     summary: Validar promocao para PROD
   *     description: Valida se um release pode ser promovido para PROD conforme policy (score, approvals, evidence, freeze)
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
   *             required:
   *               - releaseId
   *             properties:
   *               releaseId:
   *                 type: string
   *                 description: ID do release a validar
   *     responses:
   *       200:
   *         description: Validacao realizada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     allowed:
   *                       type: boolean
   *                     score:
   *                       type: number
   *                     minScore:
   *                       type: number
   *                     approvalCount:
   *                       type: number
   *                     minApprovals:
   *                       type: number
   *                     hasEvidenceUrl:
   *                       type: boolean
   *                     isFrozen:
   *                       type: boolean
   *                     reason:
   *                       type: string
   *       400:
   *         description: releaseId nao fornecido
   */
  router.post('/internal/promotions/validate-production', (req: Request, res: Response) =>
    promotionController.validateProductionPromotion(req, res).catch((err) => {
      throw err;
    })
  );

  return router;
}
