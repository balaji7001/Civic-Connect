import { useEffect } from "react";
import { FiMessageSquare, FiX } from "react-icons/fi";

import type { ComplaintRemark } from "../services/api";

interface RemarksModalProps {
  remarks: ComplaintRemark[];
  title?: string;
  complaintTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

const RemarksModal = ({
  remarks,
  title = "Admin remarks",
  complaintTitle,
  isOpen,
  onClose,
}: RemarksModalProps) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const sortedRemarks = [...remarks].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-3xl rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          aria-label="Close remarks"
        >
          <FiX size={18} />
        </button>

        <div className="border-b border-slate-200 px-6 py-6 dark:border-slate-800">
          <div className="flex items-start gap-3 pr-12">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-civic-teal/10 text-civic-teal">
              <FiMessageSquare size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">{title}</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{complaintTitle || "Complaint remarks"}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Review every official note added by the admin team for this complaint.
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-6 py-6">
          {sortedRemarks.length ? (
            sortedRemarks.map((remark) => (
              <div key={`${remark.authorName}-${remark.createdAt}-${remark.message}`} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{remark.authorName}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{new Date(remark.createdAt).toLocaleString()}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{remark.message}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
              No admin remarks have been added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemarksModal;
