import axios, { AxiosError } from 'axios';
import { BackendErrorResponse } from '../types/common';
import { logger } from '../middleware/logger';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export class ProxyService {
  static async forwardRequest(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
    requestId?: string
  ) {
    const url = `${BACKEND_URL}${path}`;

    const axiosHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (requestId) {
      axiosHeaders['X-Request-ID'] = requestId;
    }

    try {
      const response = await axios({
        method: method.toLowerCase(),
        url,
        data,
        headers: axiosHeaders,
        validateStatus: () => true,
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error(
        {
          requestId,
          method,
          path,
          backendUrl: url,
          error: axiosError.message,
        },
        'Backend request failed'
      );

      throw {
        statusCode: 502,
        message: 'Bad Gateway - Backend service unavailable',
        code: 'BACKEND_UNAVAILABLE',
      };
    }
  }

  static async getEvidenceScore(policy_id: string, requestId?: string) {
    try {
      const response = await this.forwardRequest(
        'GET',
        `/evidences/score?policy_id=${policy_id}`,
        undefined,
        {},
        requestId
      );

      if (response.status !== 200) {
        throw new Error(`Failed to fetch score: ${response.status}`);
      }

      return response.data;
    } catch (error) {
      logger.error(
        { requestId, policy_id, error },
        'Failed to get evidence score'
      );
      throw error;
    }
  }
}
