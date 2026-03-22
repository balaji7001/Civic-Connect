import type { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new HttpError(404, "Route not found"));
};

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isJoiValidationError = "isJoi" in error;
  const duplicateKeyError =
    "name" in error && error.name === "MongoServerError" && "code" in error && error.code === 11000;
  const statusCode = isJoiValidationError
    ? 400
    : duplicateKeyError
      ? 409
      : error instanceof HttpError
        ? error.statusCode
        : 500;
  const message = statusCode === 500 ? "Internal server error" : error.message;

  if (statusCode === 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
