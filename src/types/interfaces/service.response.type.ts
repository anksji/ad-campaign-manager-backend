export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  status: number;
  data?: T;
  error?: string | object;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
