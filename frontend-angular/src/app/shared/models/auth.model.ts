export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseData {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginResponse {
  success: boolean;
  data: LoginResponseData;
  requestId: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
