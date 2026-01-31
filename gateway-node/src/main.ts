import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getConfig } from '@core/config';
import { logger } from '@core/logger';
import { requestIdMiddleware } from '@presentation/middleware/requestIdMiddleware';
import { metricsMiddleware } from '@presentation/middleware/metricsMiddleware';
import { authMiddleware } from '@presentation/middleware/authMiddleware';
import { rateLimitByIp, rateLimitByUser } from '@presentation/middleware/rateLimitMiddleware';
import { errorHandlerMiddleware } from '@presentation/middleware/errorHandlerMiddleware';
import { createHealthRoutes } from '@presentation/routes/healthRoutes';
import { createSwaggerRoutes } from '@presentation/routes/swaggerRoutes';
import { createAuthRoutes } from '@presentation/routes/authRoutes';
import { createPromotionRoutes } from '@presentation/routes/promotionRoutes';
import { createProxyRoutes } from '@presentation/routes/proxyRoutes';
import { AxiosBackendClient } from '@infrastructure/http/AxiosBackendClient';

const app = express();

try {
  const config = getConfig();

  // CORS configuration
  app.use(cors({
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.use(requestIdMiddleware);
  app.use(metricsMiddleware);
  app.use(rateLimitByIp);

  const backendClient = new AxiosBackendClient(config.backendUrl);

  app.use(createHealthRoutes());
  app.use(createSwaggerRoutes());
  app.use(createAuthRoutes(backendClient));

  app.use(authMiddleware);
  app.use(rateLimitByUser);

  app.use(createPromotionRoutes(backendClient));
  app.use('/api', createProxyRoutes(backendClient));

  app.use(errorHandlerMiddleware);

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, `API Gateway running on port ${config.port}`);
    logger.info({ backendUrl: config.backendUrl }, `Backend URL: ${config.backendUrl}`);
    logger.info({ docsUrl: `http://localhost:${config.port}/docs` }, `Swagger docs: http://localhost:${config.port}/docs`);
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
