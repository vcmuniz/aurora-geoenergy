import { Router, Request, Response } from 'express';
import { CustomRequest } from '../types/common';
import { ProxyService } from '../services/proxyService';
import { ScoreService } from '../services/scoreService';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../middleware/logger';

const router = Router();

router.post('/internal/promotions/validate-production', async (req: Request, res: Response) => {
  const customReq = req as CustomRequest;

  if (!customReq.context.user) {
    return res.status(401).json(
      errorResponse('Unauthorized', 'AUTH_REQUIRED', customReq.context)
    );
  }

  if (customReq.context.user.role !== 'admin' && customReq.context.user.role !== 'senior') {
    logger.warn(
      {
        requestId: customReq.context.requestId,
        userId: customReq.context.user.id,
        role: customReq.context.user.role,
      },
      'Unauthorized promotion validation attempt'
    );
    return res.status(403).json(
      errorResponse('Forbidden - Admin role required', 'FORBIDDEN', customReq.context)
    );
  }

  try {
    const { policy_id } = req.body;

    if (!policy_id) {
      return res.status(400).json(
        errorResponse('Missing policy_id', 'VALIDATION_ERROR', customReq.context)
      );
    }

    const validation = await ScoreService.validateProductionPromotion(
      policy_id,
      customReq.context
    );

    res.status(200).json(successResponse(validation, customReq.context));
  } catch (error) {
    logger.error(
      {
        requestId: customReq.context.requestId,
        userId: customReq.context.user?.id,
        error,
      },
      'Production validation failed'
    );
    res.status(502).json(
      errorResponse(
        'Backend service unavailable',
        'BACKEND_UNAVAILABLE',
        customReq.context
      )
    );
  }
});

export default router;
