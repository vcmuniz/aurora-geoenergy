export interface IUser {
  id: string;
  email: string;
  role?: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  access_token: string;
  token_type: string;
  user: IUser;
}

export interface IPromotionValidation {
  allowed: boolean;
  score: number;
  minScore: number;
  reason?: string;
}

export interface IRequestContext {
  requestId: string;
  user?: IUser;
  timestamp: Date;
}
