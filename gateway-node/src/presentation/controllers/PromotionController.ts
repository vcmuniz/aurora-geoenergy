import { Request, Response } from 'express';
import { PromotionUseCase } from '@application/usecases/PromotionUseCase';
import { logger } from '@core/logger';
import { formatResponse } from '@core/utils';

export class PromotionController {
  constructor(private promotionUseCase: PromotionUseCase) {}

  async validateProductionPromotion(req: Request, res: Response) {
    try {
      const { releaseId } = req.body;

      if (!releaseId) {
        return res.status(400).json(
          formatResponse(false, undefined, 'releaseId is required', 'VALIDATION_ERROR', req.context.requestId)
        );
      }

      const result = await this.promotionUseCase.validateProductionPromotion(
        releaseId,
        req.context
      );

      res.status(200).json(formatResponse(true, result, undefined, undefined, req.context.requestId));
    } catch (error: any) {
      logger.error(
        { requestId: req.context.requestId, error: error.message },
        'Promotion validation failed'
      );
      throw error;
    }
  }
}
