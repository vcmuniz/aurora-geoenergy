export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginDataResponse {
  access_token: string;
  token_type: string;
  user: UserData;
}

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

export type LoginResponse = ApiResponse<LoginDataResponse>;
export type MeResponse = ApiResponse<UserData>;

export type User = UserData;
