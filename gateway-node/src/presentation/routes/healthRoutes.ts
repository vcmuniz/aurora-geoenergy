import { Router, Request, Response } from 'express';
import { formatResponse } from '@core/utils';
import { getMetrics } from '../middleware/metricsMiddleware';

export function createHealthRoutes(): Router {
  const router = Router();

  router.get('/health', (req: Request, res: Response) => {
    res.status(200).json(
      formatResponse(true, { status: 'ok' }, undefined, undefined, req.context.requestId)
    );
  });

  router.get('/metrics', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: getMetrics(),
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
