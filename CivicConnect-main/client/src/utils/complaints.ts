import type { Complaint } from "../services/api";

export const complaintStatusTone: Record<Complaint["status"], string> = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  "In Progress": "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  Resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  Rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
};

export const complaintStatusBorder: Record<Complaint["status"], string> = {
  Pending: "border-amber-200 dark:border-amber-900/60",
  "In Progress": "border-sky-200 dark:border-sky-900/60",
  Resolved: "border-emerald-200 dark:border-emerald-900/60",
  Rejected: "border-rose-200 dark:border-rose-900/60",
};

export const isClosedComplaint = (status: Complaint["status"]) => status === "Resolved" || status === "Rejected";

export const formatComplaintLifecycleMessage = (complaint: Complaint) => {
  switch (complaint.status) {
    case "Pending":
      return "Complaint is still editable while it waits for admin review.";
    case "In Progress":
      return "The responsible department is actively working on this complaint.";
    case "Resolved":
      return "The department marked this complaint as resolved.";
    case "Rejected":
      return "The complaint was rejected after review. Check the latest remarks for context.";
    default:
      return "Status updated.";
  }
};
