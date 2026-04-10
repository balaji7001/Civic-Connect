import AdminViewSelector, { type AdminView } from "./AdminViewSelector";
type AdminNavbarProps = {
  view: AdminView;
  onViewChange: (value: AdminView) => void;
};
Kbdj 
const AdminNavbar = ({ view, onViewChange }: AdminNavbarProps) => {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-soft dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Admin workspace</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          Manage complaints from intake to closure, monitor workflow risk, and switch between the main admin views from the header.
        </p>
      </div>

      <AdminViewSelector
        id="admin-navbar-view"
        value={view}
        onChange={onViewChange}
        className="w-full md:w-[18rem] md:flex-shrink-0"
        labelClassName="sr-only"
        selectClassName="h-12 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-civic-teal focus:ring-2 focus:ring-civic-teal/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        hideDescription
      />
    </div>
  );
};

export default AdminNavbar;