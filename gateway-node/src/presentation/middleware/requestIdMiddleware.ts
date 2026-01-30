import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createRequestContext } from '@core/utils';
import { logger } from '@core/logger';

declare global {
  namespace Express {
    interface Request {
      context: import('@domain/entities').IRequestContext;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4();
  req.context = createRequestContext(requestId);

  res.setHeader('X-Request-ID', requestId);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      {
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: duration,
      },
      `${req.method} ${req.path} - ${res.statusCode}`
    );
  });

  next();
}
