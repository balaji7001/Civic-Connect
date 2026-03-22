import type { NextFunction, Request, Response } from "express";

import { verifyToken } from "../config/jwt";
import { HttpError } from "./errorHandler";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "citizen" | "admin";
  };
}

const extractToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return undefined;
  }

  return authHeader.split(" ")[1];
};

export const authMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const token = extractToken(req);

  if (!token) {
    return next(new HttpError(401, "Authentication required"));
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const token = extractToken(req);

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    req.user = undefined;
  }

  next();
};

