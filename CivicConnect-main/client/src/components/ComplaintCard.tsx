import { useState } from "react";
import { FiAlertCircle, FiClock, FiImage, FiMapPin } from "react-icons/fi";
import type { Complaint } from "../services/api";
import { complaintStatusTone, isClosedComplaint } from "../utils/complaints";
import ImageLightbox from "./ImageLightbox";
const categoryStyles: Record<Complaint["category"], { label: string; accent: string }> = {
  garbage: { label: "Sanitation", accent: "border-l-civic-green" },
  water: { label: "Water Supply", accent: "border-l-sky-500" },
  electricity: { label: "Electricity", accent: "border-l-amber-500" },
  road: { label: "Road Damage", accent: "border-l-civic-road" },
  drainage: { label: "Drainage", accent: "border-l-civic-purple" },
};
const formatSlaState = (status: Complaint["status"], deadline: string) => {
  if (isClosedComplaint(status)) {
    return status;
  }

  const diff = new Date(deadline).getTime() - Date.now();

  if (diff <= 0) {
    return "Overdue";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m left`;
};

interface ComplaintCardProps {
  complaint: Complaint;
  showCitizen?: boolean;
  showTimeline?: boolean;
}

const ComplaintCard = ({ complaint, showCitizen = false, showTimeline = false }: ComplaintCardProps) => {
  const category = categoryStyles[complaint.category];
  const [isImageOpen, setIsImageOpen] = useState(false);

  return (
    <>
      <article
        className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 ${category.accent} border-l-4`}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <span>{complaint.complaintId}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{category.label}</span>
            </div>

            <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">{complaint.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{complaint.description}</p>

            <div className="mt-5 grid gap-4 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Priority</p>
                <p className="mt-2 flex items-center gap-2 font-medium">
                  <FiAlertCircle size={14} />
                  {complaint.priority}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Severity</p>
                <p className="mt-2 font-medium">{complaint.severityScore}/100</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Department</p>
                <p className="mt-2 font-medium">{complaint.department}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Location</p>
                <p className="mt-2 flex items-center gap-2 font-medium">
                  <FiMapPin size={14} />
                  {complaint.address}
                </p>
              </div>
            </div>

            {complaint.imageUrl ? (
              <button
                type="button"
                onClick={() => setIsImageOpen(true)}
                className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left transition hover:border-civic-teal dark:border-slate-800 dark:bg-slate-950"
              >
                <img
                  src={complaint.imageThumbnailUrl || complaint.imageUrl}
                  alt={complaint.title}
                  loading="lazy"
                  className="h-44 w-full object-cover"
                />
                <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <FiImage size={14} />
                  Tap to view full image
                </div>
              </button>
            ) : null}
          </div>

          <div className="flex h-[300px] flex-col gap-4 rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/70">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
              <span className={`mt-3 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${complaintStatusTone[complaint.status]}`}>
                {complaint.status}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Timeline</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-civic-orange">
                <FiClock size={14} />
                {formatSlaState(complaint.status, complaint.slaDeadline)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Created</p>
              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {new Date(complaint.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {showCitizen && typeof complaint.citizenId === "object" && complaint.citizenId ? (
          <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-800">
            Reported by <span className="font-medium text-slate-700 dark:text-slate-200">{complaint.citizenId.name}</span> � Ward {complaint.citizenId.ward}
          </div>
        ) : null}

        {showTimeline ? (
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">Submitted</span>
            <span>?</span>
            <span className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">AI Analysis Complete</span>
            <span>?</span>
            <span className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">{complaint.status}</span>
          </div>
        ) : null}
      </article>

      <ImageLightbox imageUrl={complaint.imageUrl} title={complaint.title} isOpen={isImageOpen} onClose={() => setIsImageOpen(false)} />
    </>
  );
};

export default ComplaintCard;
