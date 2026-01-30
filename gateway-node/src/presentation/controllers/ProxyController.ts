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

      if (response.status >= 200 && response.status < 300) {
        res.status(response.status).json(
          formatResponse(true, response.data, undefined, undefined, req.context.requestId)
        );
      } else {
        res.status(response.status).json(
          formatResponse(
            false,
            undefined,
            response.data?.error || response.data?.message || 'Request failed',
            response.data?.code || 'REQUEST_ERROR',
            req.context.requestId
          )
        );
      }
    } catch (error: any) {
      logger.error(
        { requestId: req.context.requestId, error: error.message },
        'Proxy request failed'
      );
      throw error;
    }
  }
}
