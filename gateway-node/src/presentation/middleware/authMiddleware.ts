import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getConfig } from '@core/config';
import { UnauthorizedException } from '@domain/exceptions';
import { addUserToContext } from '@core/utils';
import { logger } from '@core/logger';

const PUBLIC_ROUTES = ['/health', '/api/auth/login', '/api/auth/me'];

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
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid Authorization header',
      code: 'AUTH_MISSING_TOKEN',
      requestId: req.context.requestId,
      timestamp: new Date().toISOString(),
    });
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
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'AUTH_INVALID_TOKEN',
      requestId: req.context.requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
