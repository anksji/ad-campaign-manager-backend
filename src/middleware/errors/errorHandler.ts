import { ErrorRequestHandler, NextFunction, Response } from "express";
import { ErrorResponse } from "@src/types/interfaces";
import { environmentConfig } from "@src/config";

export const errorHandlerMiddleware: ErrorRequestHandler = (
  error,
  req,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  res?.status(statusCode).send({
    data: null,
    success: false,
    error: true,
    message: error.message || "Internal Server Error",
    status: statusCode,
    stack: environmentConfig.NODE_ENV === "production" ? "" : error.stack,
  });
};

export default errorHandlerMiddleware;
