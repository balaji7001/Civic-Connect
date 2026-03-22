import type { ComplaintRemark } from "../services/api";

interface RemarksPanelProps {
  remarks: ComplaintRemark[];
  title?: string;
  emptyMessage?: string;
}

const RemarksPanel = ({
  remarks,
  title = "Official remarks",
  emptyMessage = "No official remarks have been added to this complaint yet.",
}: RemarksPanelProps) => {
  const sortedRemarks = [...remarks].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">{title}</p>
      <div className="mt-4 space-y-3">
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
          <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default RemarksPanel;
