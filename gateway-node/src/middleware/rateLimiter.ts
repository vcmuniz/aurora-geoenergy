import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const maxAuthRequests = parseInt(process.env.RATE_LIMIT_MAX_AUTH_REQUESTS || '1000', 10);

export const rateLimiterByIp = rateLimit({
  windowMs,
  max: maxRequests,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const customReq = req as any;
    return !!customReq.context?.user;
  },
});

export const rateLimiterByUser = rateLimit({
  windowMs,
  max: maxAuthRequests,
  keyGenerator: (req) => {
    const customReq = req as any;
    return customReq.context?.user?.id || req.ip || 'anonymous';
  },
  message: 'Too many requests from this user',
  standardHeaders: true,
  legacyHeaders: false,
});
