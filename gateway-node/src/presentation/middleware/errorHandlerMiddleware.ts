import { Request, Response, NextFunction } from 'express';
import { DomainException } from '@domain/exceptions';
import { logger } from '@core/logger';
import { formatResponse } from '@core/utils';

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
      formatResponse(false, undefined, err.message, err.code, requestId)
    );
  }

  logger.error(
    { requestId, error: err.message, stack: err.stack },
    'Unhandled error'
  );

  res.status(500).json(
    formatResponse(
      false,
      undefined,
      'Internal server error',
      'INTERNAL_SERVER_ERROR',
      requestId
    )
  );
}
