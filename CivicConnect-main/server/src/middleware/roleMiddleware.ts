import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "./authMiddleware";
import { HttpError } from "./errorHandler";

export const roleMiddleware = (...allowedRoles: Array<"citizen" | "admin">) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new HttpError(401, "Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, "You do not have access to this resource"));
    }

    next();
  };
};

