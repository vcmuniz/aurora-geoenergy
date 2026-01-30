import { Request, Response, NextFunction } from 'express';
import { CustomRequest, ApiResponse } from '../types/common';
import { mapBackendStatusToHttpStatus } from '../utils/httpStatusMap';
import { logger } from './logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const customReq = req as CustomRequest;
  const requestId = customReq.context?.requestId || 'unknown';

  logger.error(
    {
      requestId,
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    },
    'Unhandled error'
  );

  const statusCode = err.statusCode || err.status || 500;
  const mappedStatus = mapBackendStatusToHttpStatus(statusCode);

  const response: ApiResponse = {
    success: false,
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    requestId,
    timestamp: new Date().toISOString(),
    details: err.details,
  };

  res.status(mappedStatus).json(response);
}
