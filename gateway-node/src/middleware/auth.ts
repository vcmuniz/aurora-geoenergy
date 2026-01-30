import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from '../types/common';
import jwt from 'jsonwebtoken';
import { logger } from './logger';

const PUBLIC_ROUTES = ['/health', '/api/auth/login'];

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const customReq = req as CustomRequest;

  if (PUBLIC_ROUTES.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn(
      { requestId: customReq.context.requestId, path: req.path },
      'Missing or invalid Authorization header'
    );
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'AUTH_MISSING_TOKEN',
      requestId: customReq.context.requestId,
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    customReq.context.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    logger.warn(
      { requestId: customReq.context.requestId, error: (error as Error).message },
      'Invalid JWT token'
    );
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'AUTH_INVALID_TOKEN',
      requestId: customReq.context.requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
