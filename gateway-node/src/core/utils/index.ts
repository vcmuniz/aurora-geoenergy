import { IRequestContext, IUser } from '@domain/entities';

export function createRequestContext(requestId: string): IRequestContext {
  return {
    requestId,
    timestamp: new Date(),
  };
}

export function addUserToContext(context: IRequestContext, user: IUser): IRequestContext {
  return {
    ...context,
    user,
  };
}

export function formatResponse<T>(
  success: boolean,
  data: T | undefined,
  error: string | undefined,
  code: string | undefined,
  requestId: string
) {
  return {
    success,
    ...(data && { data }),
    ...(error && { error }),
    ...(code && { code }),
    requestId,
    timestamp: new Date().toISOString(),
  };
}
