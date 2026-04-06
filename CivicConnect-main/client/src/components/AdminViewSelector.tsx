export type AdminView = "command" | "queue" | "workflow" | "sla" | "map" | "severity" | "insights" | "resolved" | "rejected";

type AdminViewOption = {
  label: string;
  value: AdminView;
};
I supposed 
type AdminViewSelectorProps = {
  id?: string;
  options?: readonly AdminViewOption[];
  value: AdminView;
  onChange: (value: AdminView) => void;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  descriptionClassName?: string;
  hideDescription?: boolean;
};

export const adminViewOptions: readonly AdminViewOption[] = [
  { value: "command", label: "Operations Overview" },
  { value: "queue", label: "Complaint Queue" },
  { value: "workflow", label: "Workflow Snapshot" },
  { value: "sla", label: "SLA Violations List" },
  { value: "map", label: "Complaint Map" },
  { value: "severity", label: "Severity Ranking" },
  { value: "insights", label: "Insight Summary" },
  { value: "resolved", label: "Resolved Complaints" },
  { value: "rejected", label: "Rejected Complaints" },
];

const AdminViewSelector = ({
  id = "admin-view",
  options = adminViewOptions,
  value,
  onChange,
  className = "",
  labelClassName = "text-sm font-medium text-slate-700 dark:text-slate-200",
  selectClassName = "mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-soft outline-none transition focus:border-civic-teal focus:ring-2 focus:ring-civic-teal/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100",
  descriptionClassName = "mt-2 text-xs text-slate-500 dark:text-slate-400",
  hideDescription = false,
}: AdminViewSelectorProps) => {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClassName}>
        Admin View
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as AdminView)}
        aria-describedby={hideDescription ? undefined : `${id}-description`}
        className={selectClassName}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hideDescription ? null : (
        <p id={`${id}-description`} className={descriptionClassName}>
          Switch between the main admin workspace sections without reloading the page.
        </p>
      )}
    </div>
  );
};

export default AdminViewSelector;
