import cron from "node-cron";

import { ComplaintModel } from "../models/Complaint";
import { notifyAdminsAboutSlaViolation } from "./notificationService";

const SLA_REMINDER_INTERVAL_MS = 6 * 60 * 60 * 1000;

export const runSlaSweep = async (): Promise<number> => {
  const now = new Date();
  const overdueComplaints = await ComplaintModel.find({
    status: { $nin: ["Resolved", "Rejected"] },
    slaDeadline: { $lt: now },
  });

  await Promise.all(
    overdueComplaints.map(async (complaint) => {
      complaint.severityScore = Math.min(100, complaint.severityScore + 10);

      const shouldNotifyAdmins =
        !complaint.lastAdminSlaReminderAt ||
        now.getTime() - complaint.lastAdminSlaReminderAt.getTime() >= SLA_REMINDER_INTERVAL_MS;

      if (shouldNotifyAdmins) {
        try {
          await notifyAdminsAboutSlaViolation({
            complaintId: complaint._id,
            complaintTitle: complaint.title,
            complaintIdLabel: complaint.complaintId,
            department: complaint.department,
            deadline: complaint.slaDeadline,
          });
          complaint.lastAdminSlaReminderAt = now;
        } catch (error) {
          console.error("Failed to create admin SLA reminder notification", error);
        }
      }

      await complaint.save();
    }),
  );

  return overdueComplaints.length;
};

export const startSlaMonitor = (): void => {
  cron.schedule("*/30 * * * *", async () => {
    try {
      await runSlaSweep();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("SLA monitor failed", error);
    }
  });
};
