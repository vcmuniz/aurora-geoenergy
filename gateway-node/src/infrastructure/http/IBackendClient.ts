export interface IBackendResponse {
  status: number;
  data: any;
  headers: Record<string, any>;
}

export interface IBackendClient {
  get(path: string, requestId?: string): Promise<IBackendResponse>;
  post(path: string, data: any, requestId?: string): Promise<IBackendResponse>;
  put(path: string, data: any, requestId?: string): Promise<IBackendResponse>;
  delete(path: string, requestId?: string): Promise<IBackendResponse>;
}
