import type { Types } from "mongoose";

import { NotificationModel } from "../models/Notification";
import { UserModel } from "../models/User";

export const createComplaintStatusNotification = async ({
  userId,
  complaintId,
  title,
  message,
}: {
  userId: string | Types.ObjectId;
  complaintId: string | Types.ObjectId;
  title: string;
  message: string;
}) => {
  return NotificationModel.create({
    userId,
    complaintId,
    title,
    message,
    read: false,
  });
};

const createNotificationsForAdmins = async ({
  complaintId,
  title,
  message,
}: {
  complaintId: string | Types.ObjectId;
  title: string;
  message: string;
}) => {
  const admins = await UserModel.find({ role: "admin" }).select("_id").lean();

  if (!admins.length) {
    return [];
  }

  return NotificationModel.insertMany(
    admins.map((admin) => ({
      userId: admin._id,
      complaintId,
      title,
      message,
      read: false,
    })),
  );
};

export const notifyAdminsAboutNewComplaint = async ({
  complaintId,
  complaintTitle,
  complaintAddress,
  complaintIdLabel,
}: {
  complaintId: string | Types.ObjectId;
  complaintTitle: string;
  complaintAddress: string;
  complaintIdLabel: string;
}) => {
  return createNotificationsForAdmins({
    complaintId,
    title: "New complaint submitted",
    message: `A new complaint '${complaintTitle}' (${complaintIdLabel}) was submitted for ${complaintAddress}.`,
  });
};

export const notifyAdminsAboutSlaViolation = async ({
  complaintId,
  complaintTitle,
  complaintIdLabel,
  department,
  deadline,
}: {
  complaintId: string | Types.ObjectId;
  complaintTitle: string;
  complaintIdLabel: string;
  department: string;
  deadline: Date;
}) => {
  return createNotificationsForAdmins({
    complaintId,
    title: "SLA violation alert",
    message: `Complaint '${complaintTitle}' (${complaintIdLabel}) assigned to ${department} is overdue since ${deadline.toLocaleString()}.`,
  });
};

export const listNotificationsForUser = async (userId: string, limit = 12) => {
  const [items, unreadCount] = await Promise.all([
    NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit),
    NotificationModel.countDocuments({ userId, read: false }),
  ]);

  return {
    items,
    unreadCount,
  };
};

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  return NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { read: true } },
    { new: true },
  );
};
