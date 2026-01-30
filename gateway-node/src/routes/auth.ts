import { Router, Request, Response } from 'express';
import { CustomRequest } from '../types/common';
import { ProxyService } from '../services/proxyService';
import { successResponse, errorResponse } from '../utils/response';
import { mapBackendStatusToHttpStatus } from '../utils/httpStatusMap';
import { logger } from '../middleware/logger';

const router = Router();

router.post('/api/auth/login', async (req: Request, res: Response) => {
  const customReq = req as CustomRequest;

  try {
    const response = await ProxyService.forwardRequest(
      'POST',
      '/auth/login',
      req.body,
      undefined,
      customReq.context.requestId
    );

    res.status(response.status).json(
      response.status === 200
        ? successResponse(response.data, customReq.context)
        : errorResponse(
            response.data?.error || 'Login failed',
            response.data?.code || 'AUTH_ERROR',
            customReq.context,
            response.data?.details
          )
    );
  } catch (error) {
    logger.error(
      { requestId: customReq.context.requestId, error },
      'Login request failed'
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

router.get('/api/auth/me', async (req: Request, res: Response) => {
  const customReq = req as CustomRequest;

  try {
    const authHeader = req.headers.authorization;
    const response = await ProxyService.forwardRequest(
      'GET',
      '/auth/me',
      undefined,
      authHeader ? { Authorization: authHeader } : undefined,
      customReq.context.requestId
    );

    res.status(response.status).json(
      response.status === 200
        ? successResponse(response.data, customReq.context)
        : errorResponse(
            response.data?.error || 'Failed to fetch user',
            response.data?.code || 'USER_ERROR',
            customReq.context
          )
    );
  } catch (error) {
    logger.error(
      { requestId: customReq.context.requestId, error },
      'Get user request failed'
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
