import axios, { AxiosError, AxiosInstance } from 'axios';
import { IBackendClient, IBackendResponse } from './IBackendClient';
import { BackendException } from '@domain/exceptions';
import { logger } from '@core/logger';

export class AxiosBackendClient implements IBackendClient {
  private client: AxiosInstance;

  constructor(baseURL: string = process.env.BACKEND_URL || 'http://localhost:8000') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      validateStatus: () => true,
    });
  }

  async get(path: string, requestId?: string): Promise<IBackendResponse> {
    return this.request('GET', path, undefined, requestId);
  }

  async post(path: string, data: any, requestId?: string): Promise<IBackendResponse> {
    return this.request('POST', path, data, requestId);
  }

  async put(path: string, data: any, requestId?: string): Promise<IBackendResponse> {
    return this.request('PUT', path, data, requestId);
  }

  async delete(path: string, requestId?: string): Promise<IBackendResponse> {
    return this.request('DELETE', path, undefined, requestId);
  }

  private async request(
    method: string,
    path: string,
    data?: any,
    requestId?: string
  ): Promise<IBackendResponse> {
    try {
      const response = await this.client({
        method,
        url: path,
        data,
        headers: {
          'Content-Type': 'application/json',
          ...(requestId && { 'X-Request-ID': requestId }),
        },
      });

      if (response.status >= 500) {
        logger.warn(
          { requestId, method, path, status: response.status },
          'Backend returned server error'
        );
        throw new BackendException('Backend service error');
      }

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof BackendException) throw error;

      const axiosError = error as AxiosError;
      logger.error(
        { requestId, method, path, error: axiosError.message },
        'Backend request failed'
      );
      throw new BackendException('Backend service unavailable');
    }
  }
}
