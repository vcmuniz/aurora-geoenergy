import { Request, Response } from 'express';
import { AuthUseCase } from '@application/usecases/AuthUseCase';
import { logger } from '@core/logger';
import { formatResponse } from '@core/utils';

export class AuthController {
  constructor(private authUseCase: AuthUseCase) {}

  async login(req: Request, res: Response, next: Function) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json(
          formatResponse(false, undefined, 'Email and password required', 'VALIDATION_ERROR', req.context.requestId)
        );
      }

      const result = await this.authUseCase.login(email, password, req.context);
      res.status(200).json(formatResponse(true, result, undefined, undefined, req.context.requestId));
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: Function) {
    try {
      const authHeader = req.headers.authorization;
      const result = await this.authUseCase.getMe(req.context, authHeader);
      res.status(200).json(formatResponse(true, result, undefined, undefined, req.context.requestId));
    } catch (error) {
      next(error);
    }
  }
}
