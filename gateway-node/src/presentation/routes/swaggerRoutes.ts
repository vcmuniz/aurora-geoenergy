import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@infrastructure/config/swagger';

export function createSwaggerRoutes(): Router {
  const router = Router();

  router.use('/docs', swaggerUi.serve);
  router.get('/docs', swaggerUi.setup(swaggerSpec, { customCss: '.swagger-ui .topbar { display: none }' }));
  router.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  return router;
}
