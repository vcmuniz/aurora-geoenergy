import { IRequestContext, IUser } from '@domain/entities';

export interface ErrorDetail {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorDetail;
  requestId: string;
  timestamp: string;
}

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

export function formatSuccessResponse<T>(
  data: T,
  requestId: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

export function formatErrorResponse(
  code: string,
  message: string,
  details?: Record<string, any>,
  requestId?: string
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    requestId: requestId || 'unknown',
    timestamp: new Date().toISOString(),
  };
}

// Compatibilidade com código antigo
export function formatResponse<T>(
  success: boolean,
  data: T | undefined,
  error: string | undefined,
  code: string | undefined,
  requestId: string
): ApiResponse {
  if (success && data) {
    return formatSuccessResponse(data, requestId);
  } else {
    return formatErrorResponse(code || 'UNKNOWN_ERROR', error || 'Unknown error', undefined, requestId);
  }
}
