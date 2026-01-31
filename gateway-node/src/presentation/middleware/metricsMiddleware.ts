import { Request, Response, NextFunction } from 'express';

interface RouteMetric {
  count: number;
  totalDurationMs: number;
  lastRequestAt: string;
}

const metrics: Map<string, RouteMetric> = new Map();

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const key = `${req.method} ${req.route?.path || req.path}`;

    const existing = metrics.get(key) || { count: 0, totalDurationMs: 0, lastRequestAt: '' };
    metrics.set(key, {
      count: existing.count + 1,
      totalDurationMs: existing.totalDurationMs + duration,
      lastRequestAt: new Date().toISOString(),
    });
  });

  next();
}

export function getMetrics(): Record<string, RouteMetric & { avgDurationMs: number }> {
  const result: Record<string, RouteMetric & { avgDurationMs: number }> = {};
  metrics.forEach((value, key) => {
    result[key] = {
      ...value,
      avgDurationMs: Math.round(value.totalDurationMs / value.count),
    };
  });
  return result;
}
