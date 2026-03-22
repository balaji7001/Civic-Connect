import type { NextFunction, Request, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { HttpError } from "../middleware/errorHandler";
import {
  getAdminDashboardTrendMetrics,
  getCitizenDashboardTrendMetrics,
  getPublicDashboardTrendMetrics,
} from "../services/dashboardTrendService";

export const getAdminDashboardTrends = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await getAdminDashboardTrendMetrics();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicDashboardTrends = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await getPublicDashboardTrendMetrics();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getCitizenDashboardTrends = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const data = await getCitizenDashboardTrendMetrics(req.user.id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
