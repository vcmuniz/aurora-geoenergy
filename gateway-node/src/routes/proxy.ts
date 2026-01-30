import { Router, Request, Response } from 'express';
import { CustomRequest } from '../types/common';
import { ProxyService } from '../services/proxyService';
import { successResponse, errorResponse } from '../utils/response';
import { mapBackendStatusToHttpStatus } from '../utils/httpStatusMap';
import { logger } from '../middleware/logger';

const router = Router();

router.all('/*', async (req: Request, res: Response) => {
  const customReq = req as CustomRequest;
  const targetPath = req.path.replace(/^\/api/, '');

  try {
    const headers: Record<string, string> = {};

    if (customReq.context.user) {
      headers['Authorization'] = `Bearer ${req.headers.authorization?.split(' ')[1] || ''}`;
    }

    const response = await ProxyService.forwardRequest(
      req.method,
      targetPath,
      ['GET', 'HEAD', 'DELETE'].includes(req.method.toUpperCase()) ? undefined : req.body,
      headers,
      customReq.context.requestId
    );

    const mappedStatus = mapBackendStatusToHttpStatus(response.status);

    if (response.status >= 200 && response.status < 300) {
      res.status(mappedStatus).json(successResponse(response.data, customReq.context));
    } else {
      res.status(mappedStatus).json(
        errorResponse(
          response.data?.error || response.data?.message || 'Request failed',
          response.data?.code || 'REQUEST_ERROR',
          customReq.context,
          response.data?.details,
          mappedStatus
        )
      );
    }
  } catch (error: any) {
    logger.error(
      {
        requestId: customReq.context.requestId,
        method: req.method,
        path: req.path,
        error: error.message,
      },
      'Proxy request failed'
    );

    res.status(error.statusCode || 502).json(
      errorResponse(
        error.message || 'Backend service unavailable',
        error.code || 'BACKEND_UNAVAILABLE',
        customReq.context
      )
    );
  }
});

export default router;
