import 'dotenv/config';
import express from 'express';
import { getConfig } from '@core/config';
import { logger } from '@core/logger';
import { requestIdMiddleware } from '@presentation/middleware/requestIdMiddleware';
import { authMiddleware } from '@presentation/middleware/authMiddleware';
import { rateLimitByIp, rateLimitByUser } from '@presentation/middleware/rateLimitMiddleware';
import { errorHandlerMiddleware } from '@presentation/middleware/errorHandlerMiddleware';
import { createHealthRoutes } from '@presentation/routes/healthRoutes';
import { createAuthRoutes } from '@presentation/routes/authRoutes';
import { createPromotionRoutes } from '@presentation/routes/promotionRoutes';
import { createProxyRoutes } from '@presentation/routes/proxyRoutes';
import { AxiosBackendClient } from '@infrastructure/http/AxiosBackendClient';

const app = express();

try {
  const config = getConfig();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.use(requestIdMiddleware);
  app.use(rateLimitByIp);

  const backendClient = new AxiosBackendClient(config.backendUrl);

  app.use(createHealthRoutes());
  app.use(createAuthRoutes(backendClient));

  app.use(authMiddleware);
  app.use(rateLimitByUser);

  app.use(createPromotionRoutes(backendClient));
  app.use('/api', createProxyRoutes(backendClient));

  app.use(errorHandlerMiddleware);

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, `API Gateway running on port ${config.port}`);
    logger.info({ backendUrl: config.backendUrl }, `Backend URL: ${config.backendUrl}`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
} catch (error) {
  logger.error({ error }, 'Failed to start application');
  process.exit(1);
}
