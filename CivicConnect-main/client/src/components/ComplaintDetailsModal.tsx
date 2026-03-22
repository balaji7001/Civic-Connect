import { useEffect, useState } from "react";
import { FiClock, FiImage, FiMapPin, FiX } from "react-icons/fi";

import type { Complaint, Department, User } from "../services/api";
import { complaintStatusTone, isClosedComplaint } from "../utils/complaints";

type ComplaintDetailsModalProps = {
  complaint: Complaint | null;
  departments: Department[];
  manageDepartment: string;
  remark: string;
  selectedStatus: Complaint["status"];
  actionLoading: boolean;
  onDepartmentChange: (value: string) => void;
  onRemarkChange: (value: string) => void;
  onStatusChange: (status: Complaint["status"]) => void;
  onClose: () => void;
  onSubmit: () => void;
  onOpenImage: (image: { url: string; title: string }) => void;
};

const priorityTone: Record<Complaint["priority"], string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  High: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
};

const actionTone: Record<"In Progress" | "Resolved" | "Rejected", string> = {
  "In Progress": "bg-sky-600 text-white hover:bg-sky-700",
  Resolved: "bg-emerald-600 text-white hover:bg-emerald-700",
  Rejected: "bg-rose-600 text-white hover:bg-rose-700",
};

const ComplaintDetailsModal = ({
  complaint,
  departments,
  manageDepartment,
  remark,
  selectedStatus,
  actionLoading,
  onDepartmentChange,
  onRemarkChange,
  onStatusChange,
  onClose,
  onSubmit,
  onOpenImage,
}: ComplaintDetailsModalProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!complaint) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => setIsVisible(true));
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      setIsVisible(false);
    };
  }, [complaint, onClose]);

  if (!complaint) {
    return null;
  }

  const citizen = complaint.citizenId && typeof complaint.citizenId === "object" ? (complaint.citizenId as User) : null;
  const isReadOnly = isClosedComplaint(complaint.status);
  const readOnlyMessage = complaint.status === "Resolved"
    ? "This complaint is resolved and can no longer be updated."
    : "This complaint is rejected and can no longer be updated.";
  const sortedRemarks = complaint.remarks
    .slice()
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className={`w-full max-w-4xl rounded-[1.5rem] bg-white shadow-2xl transition-all duration-200 dark:bg-slate-900 ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-civic-teal">Admin control panel</p>
            <h2 id="complaint-modal-title" className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {complaint.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{complaint.complaintId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
            aria-label="Close complaint details"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="max-h-[85vh] overflow-y-auto px-6 py-6">
          <div className="space-y-8">
            <section>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${complaintStatusTone[complaint.status]}`}>
                  {complaint.status}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone[complaint.priority]}`}>
                  {complaint.priority} priority
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {complaint.department}
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{complaint.description}</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Citizen info</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {citizen?.name || "Citizen details unavailable"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{citizen?.email || "No email available"}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{citizen?.ward || "Ward unavailable"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Department</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{complaint.department}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Severity score {complaint.severityScore}/100</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Location</p>
                  <p className="mt-2 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <FiMapPin className="mt-0.5" size={14} />
                    <span>{complaint.address}</span>
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Created</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <FiClock size={14} />
                    {new Date(complaint.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    SLA deadline {new Date(complaint.slaDeadline).toLocaleString()}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-civic-teal">Evidence</p>
              {complaint.imageUrl ? (
                <button
                  type="button"
                  onClick={() => onOpenImage({ url: complaint.imageUrl || "", title: complaint.title })}
                  className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left transition hover:border-civic-teal dark:border-slate-800 dark:bg-slate-950"
                >
                  <img
                    src={complaint.imageThumbnailUrl || complaint.imageUrl}
                    alt={complaint.title}
                    loading="lazy"
                    className="max-h-80 w-full object-cover"
                  />
                  <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <FiImage size={14} />
                    Open full-size evidence image
                  </div>
                </button>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
                  No image evidence was attached to this complaint.
                </div>
              )}
            </section>

            <section>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-civic-teal">Admin actions</p>
                  {isReadOnly ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {readOnlyMessage}
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["In Progress", "Resolved", "Rejected"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => onStatusChange(status)}
                          disabled={isReadOnly}
                          className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                            selectedStatus === status
                              ? actionTone[status]
                              : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          } ${isReadOnly ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          {status === "In Progress" ? "Start Progress" : status === "Resolved" ? "Resolve" : "Reject"}
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                      <div>
                        <label htmlFor="complaint-modal-department" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Assign Department
                        </label>
                        <select
                          id="complaint-modal-department"
                          value={manageDepartment}
                          onChange={(event) => onDepartmentChange(event.target.value)}
                          disabled={isReadOnly}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-civic-teal focus:ring-2 focus:ring-civic-teal/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                        >
                          {departments.map((department) => (
                            <option key={department._id} value={department.name}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="complaint-modal-remark" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Add remark
                        </label>
                        <textarea
                          id="complaint-modal-remark"
                          rows={5}
                          value={remark}
                          onChange={(event) => onRemarkChange(event.target.value)}
                          disabled={isReadOnly}
                          placeholder="Add a field update, rejection reason, assignment note, or closure message"
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-civic-teal focus:ring-2 focus:ring-civic-teal/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Selected update: <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedStatus}</span>
                      </p>
                      <button
                        type="button"
                        onClick={onSubmit}
                        disabled={actionLoading || isReadOnly}
                        className="rounded-full bg-civic-blue px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isReadOnly ? `Already ${complaint.status}` : actionLoading ? "Updating..." : "Update Complaint"}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-civic-teal">Remark history</p>
                  <div className="mt-4 space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/30">
                    {sortedRemarks.length ? (
                      sortedRemarks.map((item) => (
                        <div key={`${item.authorName}-${item.createdAt}-${item.message}`} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.authorName}</p>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
                        No remarks yet. Add notes here to document investigation, rejection reasons, or resolution details.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailsModal;
