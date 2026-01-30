import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getConfig } from '@core/config';
import { UnauthorizedException } from '@domain/exceptions';
import { addUserToContext } from '@core/utils';
import { logger } from '@core/logger';
import { formatErrorResponse } from '@core/utils';

const PUBLIC_ROUTES = ['/health', '/api/health', '/api/auth/login', '/api/auth/me'];

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (PUBLIC_ROUTES.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    logger.warn(
      { requestId: req.context.requestId, path: req.path },
      'Missing Authorization header'
    );
    return res.status(401).json(
      formatErrorResponse('AUTH_MISSING_TOKEN', 'Missing or invalid Authorization header', undefined, req.context.requestId)
    );
  }

  const token = authHeader.substring(7);
  const config = getConfig();

  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: [config.jwtAlgorithm as 'HS256' | 'HS512'],
    }) as any;

    req.context = addUserToContext(req.context, {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      role: decoded.role,
    });

    next();
  } catch (error) {
    logger.warn(
      { requestId: req.context.requestId, error: (error as Error).message },
      'Invalid JWT token'
    );
    res.status(401).json(
      formatErrorResponse('AUTH_INVALID_TOKEN', 'Invalid or expired token', undefined, req.context.requestId)
    );
  }
}
