import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { HttpError } from "../middleware/errorHandler";
import { listNotificationsForUser, markNotificationAsRead } from "../services/notificationService";

export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const requestedLimit = Number(req.query.limit || 12);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 12;
    const notifications = await listNotificationsForUser(req.user.id, limit);

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const notification = await markNotificationAsRead(String(req.params.id), req.user.id);

    if (!notification) {
      throw new HttpError(404, "Notification not found");
    }

    const notifications = await listNotificationsForUser(req.user.id);

    res.json({
      success: true,
      data: {
        notification,
        unreadCount: notifications.unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
