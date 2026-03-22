import { useEffect, useMemo, useState } from "react";

import ComplaintCard from "../components/ComplaintCard";
import Loader from "../components/Loader";
import StatsCard from "../components/StatsCard";
import api, { extractApiError, type Complaint } from "../services/api";
import { isClosedComplaint } from "../utils/complaints";

const Complaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadComplaints = async () => {
      setLoading(true);
      try {
        const response = await api.get<{ data: Complaint[] }>("/complaints");
        setComplaints(response.data.data);
        setError("");
      } catch (loadError) {
        setError(extractApiError(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadComplaints();
  }, []);

  const filteredComplaints = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return complaints.filter((complaint) => {
      if (complaint.status === "Rejected") {
        return false;
      }
      const matchesCategory = categoryFilter ? complaint.category === categoryFilter : true;
      const matchesStatus = statusFilter ? complaint.status === statusFilter : true;
      const matchesSearch = normalizedSearch
        ? `${complaint.title} ${complaint.description} ${complaint.address} ${complaint.complaintId}`.toLowerCase().includes(normalizedSearch)
        : true;

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [categoryFilter, complaints, searchTerm, statusFilter]);

  const closedComplaints = useMemo(() => filteredComplaints.filter((complaint) => complaint.status === "Resolved"), [filteredComplaints]);
  const activeComplaints = useMemo(() => filteredComplaints.filter((complaint) => !isClosedComplaint(complaint.status)), [filteredComplaints]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Public Transparency Portal</p>
        <h1 className="mt-2 font-serif text-4xl font-bold">Explore civic complaints across the city</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Track how complaints move from submission to field work and resolution while filtering by category, status, and location.
        </p>
      </div>

      {error ? <div className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}

      {loading ? (
        <Loader label="Loading public complaints..." className="min-h-[40vh]" />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <StatsCard label="Total Complaints" value={filteredComplaints.length} tone="blue" description="Total civic complaints currently visible in the public transparency portal." />
            <StatsCard label="Active Complaints" value={activeComplaints.length} tone="orange" description="Complaints still under review or active work." />
            <StatsCard label="Closed Complaints" value={closedComplaints.length} tone="teal" description="Resolved complaints published for public transparency." />
          </div>

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search complaints by ID, title, location, or keywords" />
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="">All issue categories</option>
                <option value="garbage">Garbage</option>
                <option value="water">Water</option>
                <option value="electricity">Electricity</option>
                <option value="road">Road</option>
                <option value="drainage">Drainage</option>
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 text-sm text-slate-500">
            <p>{filteredComplaints.length} public complaints found</p>
            <p>Complaints are ordered by most recent submissions</p>
          </div>

          <div className="mt-8 space-y-10">
            <section>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Active complaints</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Complaints currently being processed by municipal departments</h2>
                </div>
                <p className="text-sm text-slate-500">{activeComplaints.length} active</p>
              </div>

              <div className="space-y-5">
                {activeComplaints.length ? (
                  activeComplaints.map((complaint) => <ComplaintCard key={complaint._id} complaint={complaint} />)
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
                    No active civic complaints matched the selected filters.
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Closed complaints</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Resolved complaints published for public transparency</h2>
                </div>
                <p className="text-sm text-slate-500">{closedComplaints.length} closed</p>
              </div>

              <div className="space-y-5">
                {closedComplaints.length ? (
                  closedComplaints.map((complaint) => <ComplaintCard key={complaint._id} complaint={complaint} />)
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
                    No closed complaints matched the selected filters.
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
};

export default Complaints;
