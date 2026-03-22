import { FiAlertCircle, FiClock, FiImage, FiMapPin } from "react-icons/fi";

import Loader from "./Loader";
import MapView from "./MapView";
import type { Complaint } from "../services/api";
import { complaintStatusTone, isClosedComplaint } from "../utils/complaints";

type ComplaintQueueProps = {
  complaints: Complaint[];
  loading: boolean;
  onSelectComplaint: (complaint: Complaint) => void;
  selectedComplaintId?: string | null;
  title?: string;
  description?: string;
  emptyMessage?: string;
  itemLabel?: string;
  showMap?: boolean;
};

const descriptionClampStyle = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
} as const;

const priorityTone: Record<Complaint["priority"], string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  High: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
};

const getSlaRisk = (complaint: Complaint) => {
  if (isClosedComplaint(complaint.status)) {
    return { dot: "bg-slate-300 dark:bg-slate-600", label: "Closed" };
  }

  const hoursUntilDeadline = (new Date(complaint.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilDeadline <= 0) {
    return { dot: "bg-rose-500", label: "Overdue" };
  }

  if (hoursUntilDeadline <= 12) {
    return { dot: "bg-amber-500", label: "At risk" };
  }

  return { dot: "bg-emerald-500", label: "Healthy" };
};

const ComplaintQueue = ({
  complaints,
  loading,
  onSelectComplaint,
  selectedComplaintId,
  title = "Complaint queue",
  description = "Review every complaint in a richer list view, then open the action modal to assign departments, add remarks, and update status.",
  emptyMessage = "No complaints matched the current filters.",
  itemLabel = "items",
  showMap = true,
}: ComplaintQueueProps) => {
  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">{title}</p>
            <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            {complaints.length} {itemLabel}
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <Loader label={`Loading ${title.toLowerCase()}...`} className="py-12" />
          ) : complaints.length ? (
            complaints.map((complaint) => {
              const slaRisk = getSlaRisk(complaint);
              const isActive = complaint._id === selectedComplaintId;

              return (
                <button
                  key={complaint._id}
                  type="button"
                  onClick={() => onSelectComplaint(complaint)}
                  className={`w-full rounded-[1.75rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 ${
                    isActive ? "border-civic-teal ring-2 ring-civic-teal/20" : ""
                  }`}
                >
                  <div className="grid gap-4 md:grid-cols-[7rem_minmax(0,1fr)]">
                    {complaint.imageUrl ? (
                      <img src={complaint.imageThumbnailUrl || complaint.imageUrl} alt={complaint.title} loading="lazy" className="h-28 w-full rounded-2xl object-cover" />
                    ) : (
                      <div className="grid h-28 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                        <FiImage size={20} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{complaint.complaintId}</p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{complaint.title}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${complaintStatusTone[complaint.status]}`}>{complaint.status}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone[complaint.priority]}`}>{complaint.priority} priority</span>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300" style={descriptionClampStyle}>{complaint.description}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{complaint.department}</span>
                        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800"><FiMapPin size={12} /> {complaint.address}</span>
                        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800"><FiClock size={12} /> {new Date(complaint.createdAt).toLocaleString()}</span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                          <span className={`h-2.5 w-2.5 rounded-full ${slaRisk.dot}`} aria-hidden="true" />
                          SLA {slaRisk.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
              {emptyMessage}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ComplaintQueue;