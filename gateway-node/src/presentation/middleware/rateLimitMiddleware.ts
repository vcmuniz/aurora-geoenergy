import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { getConfig } from '@core/config';

const config = getConfig();

export const rateLimitByIp = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => !!req.context?.user,
});

export const rateLimitByUser = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMaxAuth,
  keyGenerator: (req: Request) => req.context?.user?.id || req.ip || 'anonymous',
  message: 'Too many requests from this user',
  standardHeaders: true,
  legacyHeaders: false,
});
