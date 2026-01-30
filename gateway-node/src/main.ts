import 'dotenv/config';
import express from 'express';
import { requestContextMiddleware, logger } from './middleware/logger';
import { authMiddleware } from './middleware/auth';
import { rateLimiterByIp, rateLimiterByUser } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import promotionsRoutes from './routes/promotions';
import proxyRoutes from './routes/proxy';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(requestContextMiddleware);
app.use(rateLimiterByIp);

app.use(healthRoutes);

app.use(authMiddleware);
app.use(rateLimiterByUser);

app.use(authRoutes);
app.use(promotionsRoutes);
app.use('/api', proxyRoutes);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, `API Gateway running on port ${PORT}`);
  logger.info(
    { backendUrl: process.env.BACKEND_URL },
    `Backend URL: ${process.env.BACKEND_URL}`
  );
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
