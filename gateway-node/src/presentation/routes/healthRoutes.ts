import { Router, Request, Response } from 'express';
import { formatResponse } from '@core/utils';

export function createHealthRoutes(): Router {
  const router = Router();

  router.get('/health', (req: Request, res: Response) => {
    res.status(200).json(
      formatResponse(true, { status: 'ok' }, undefined, undefined, req.context.requestId)
    );
  });

  return router;
}
