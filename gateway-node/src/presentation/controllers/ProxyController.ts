import { Request, Response } from 'express';
import { IBackendClient } from '@infrastructure/http/IBackendClient';
import { logger } from '@core/logger';
import { formatResponse } from '@core/utils';

export class ProxyController {
  constructor(private backendClient: IBackendClient) {}

  async forward(req: Request, res: Response) {
    try {
      const targetPath = req.path.replace(/^\/api/, '');
      const method = req.method.toUpperCase();

      const response = await (this.backendClient as any)[method.toLowerCase()](
        targetPath,
        ['GET', 'HEAD', 'DELETE'].includes(method) ? undefined : req.body,
        req.context.requestId
      );

      // Backend retorna resposta formatada, passar através com requestId/timestamp do gateway
      const backendResponse = response.data;
      res.status(response.status).json({
        ...backendResponse,
        requestId: req.context.requestId,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      // BackendException é lançada com statusCode, passar error do backend
      const statusCode = error.statusCode || 500;
      const errorMessage = error.message || 'Backend error';
      
      logger.warn(
        { requestId: req.context.requestId, statusCode, errorMessage },
        'Backend error caught'
      );
      
      res.status(statusCode).json(
        formatResponse(
          false,
          undefined,
          errorMessage,
          error.code || 'BACKEND_ERROR',
          req.context.requestId
        )
      );
    }
  }
}
