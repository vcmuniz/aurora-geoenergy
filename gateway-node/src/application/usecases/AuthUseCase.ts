import { IRequestContext, ILoginResponse } from '@domain/entities';
import { IBackendClient } from '@infrastructure/http/IBackendClient';
import { logger } from '@core/logger';

export class AuthUseCase {
  constructor(private backendClient: IBackendClient) {}

  async login(email: string, password: string, context: IRequestContext): Promise<ILoginResponse> {
    logger.info(
      { requestId: context.requestId, email },
      'Executing login use case'
    );

    const response = await this.backendClient.post('/auth/login', { email, password }, context.requestId);
    return response.data;
  }

  async getMe(context: IRequestContext, authHeader?: string): Promise<any> {
    logger.info(
      { requestId: context.requestId, userId: context.user?.id },
      'Executing get me use case'
    );

    const headers: Record<string, string> = {};
    if (authHeader) {
      headers.Authorization = authHeader;
    }
    const response = await this.backendClient.get('/auth/me', context.requestId, headers);
    return response.data;
  }
}
