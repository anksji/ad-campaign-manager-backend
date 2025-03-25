export interface MessageResponse<T = null> {
  data: T;
  success: boolean;
  error: boolean;
  message: string;
  status: number;
  stack?: any;
}
