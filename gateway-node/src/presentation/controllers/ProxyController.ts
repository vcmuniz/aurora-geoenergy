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
      
      // Construir path com query string
      const pathWithQuery = Object.keys(req.query).length > 0 
        ? `${targetPath}?${new URLSearchParams(req.query as any).toString()}`
        : targetPath;
      
      // Extrair headers relevantes da requisição original
      const forwardedHeaders: Record<string, string> = {};
      if (req.headers.authorization) {
        forwardedHeaders.authorization = req.headers.authorization as string;
      }

      let response;
      if (method === 'GET' || method === 'HEAD' || method === 'DELETE') {
        response = await (this.backendClient as any)[method.toLowerCase()](
          pathWithQuery,
          req.context.requestId,
          forwardedHeaders
        );
      } else {
        response = await (this.backendClient as any)[method.toLowerCase()](
          pathWithQuery,
          req.body,
          req.context.requestId,
          forwardedHeaders
        );
      }

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
