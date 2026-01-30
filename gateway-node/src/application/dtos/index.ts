export interface ApiResponseDTO<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  requestId: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface ErrorResponseDTO {
  success: false;
  error: string;
  code: string;
  requestId: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface BackendResponseDTO {
  error?: string;
  code?: string;
  message?: string;
  status_code?: number;
  details?: Record<string, any>;
  [key: string]: any;
}
