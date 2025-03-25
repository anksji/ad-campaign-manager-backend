import { MessageResponse } from "@src/types/interfaces";

export const customResponse = <T>({
  data,
  success,
  error,
  message,
  status,
}: MessageResponse<T>) => {
  return {
    success,
    error,
    message,
    status,
    data,
  };
};
