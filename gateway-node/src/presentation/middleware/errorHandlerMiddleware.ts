import { Request, Response, NextFunction } from 'express';
import { DomainException } from '@domain/exceptions';
import { logger } from '@core/logger';
import { formatErrorResponse } from '@core/utils';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.context?.requestId || 'unknown';

  if (err instanceof DomainException) {
    logger.warn(
      { requestId, code: err.code, status: err.statusCode },
      `Domain exception: ${err.message}`
    );

    return res.status(err.statusCode).json(
      formatErrorResponse(err.code, err.message, undefined, requestId)
    );
  }

  logger.error(
    { requestId, error: err.message, stack: err.stack },
    'Unhandled error'
  );

  res.status(500).json(
    formatErrorResponse('INTERNAL_SERVER_ERROR', 'Internal server error', undefined, requestId)
  );
}
