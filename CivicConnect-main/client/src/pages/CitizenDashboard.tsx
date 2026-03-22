import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import ComplaintCard from "../components/ComplaintCard";
import Loader from "../components/Loader";
import RemarksModal from "../components/RemarksModal";
import StatsCard from "../components/StatsCard";
import { useAuth } from "../hooks/useAuth";
import api, {
  extractApiError,
  type Complaint,
  type TrendMetric,
} from "../services/api";

type CitizenDashboardTrends = {
  pending: TrendMetric;
  inProgress: TrendMetric;
  resolved: TrendMetric;
  rejected: TrendMetric;
  updates: TrendMetric;
};

const emptyTrendMetric: TrendMetric = {
  value: 0,
  current: 0,
  previous: 0,
  trend: 0,
  direction: "neutral",
};

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboardTrends, setDashboardTrends] =
    useState<CitizenDashboardTrends | null>(null);
  const [selectedRemarksComplaint, setSelectedRemarksComplaint] =
    useState<Complaint | null>(null);
  const [filters, setFilters] = useState({
    query: "",
    category: "",
    status: "",
    remarks: "",
  });
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    const loadTrendSummary = async () => {
      try {
        const trendResponse = await api.get<{ data: CitizenDashboardTrends }>(
          "/citizen/dashboard-trends",
        );
        setDashboardTrends(trendResponse.data.data);
      } catch (loadError) {
        setError(extractApiError(loadError));
      }
    };

    void loadTrendSummary();
  }, []);

  useEffect(() => {
    const loadComplaints = async () => {
      if (hasLoadedOnceRef.current) {
        setFilterLoading(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({ mine: "true" });

        if (filters.query.trim()) {
          params.set("query", filters.query.trim());
        }

        if (filters.category) {
          params.set("category", filters.category);
        }

        if (filters.status) {
          params.set("status", filters.status);
        }

        const response = await api.get<{ data: Complaint[] }>(
          `/complaints?${params.toString()}`,
        );

        let complaintResults = response.data.data;

        if (filters.remarks === "with-remarks") {
          complaintResults = complaintResults.filter(
            (complaint) => complaint.remarks.length > 0,
          );
        }

        if (filters.remarks === "without-remarks") {
          complaintResults = complaintResults.filter(
            (complaint) => complaint.remarks.length === 0,
          );
        }

        setComplaints(complaintResults);
        setError("");
        hasLoadedOnceRef.current = true;
      } catch (loadError) {
        setError(extractApiError(loadError));
      } finally {
        setLoading(false);
        setFilterLoading(false);
      }
    };

    void loadComplaints();
  }, [filters.category, filters.query, filters.remarks, filters.status]);

  const pendingComplaints = useMemo(
    () => complaints.filter((c) => c.status === "Pending"),
    [complaints],
  );
  const inProgressComplaints = useMemo(
    () => complaints.filter((c) => c.status === "In Progress"),
    [complaints],
  );
  const resolvedComplaints = useMemo(
    () => complaints.filter((c) => c.status === "Resolved"),
    [complaints],
  );
  const rejectedComplaints = useMemo(
    () => complaints.filter((c) => c.status === "Rejected"),
    [complaints],
  );
  const statTrends = dashboardTrends || {
    pending: emptyTrendMetric,
    inProgress: emptyTrendMetric,
    resolved: emptyTrendMetric,
    rejected: emptyTrendMetric,
    updates: emptyTrendMetric,
  };

  const complaintSections = [
    {
      key: "pending",
      title: "Pending complaints",
      subtitle: "Complaints that can still be improved by you",
      complaints: pendingComplaints,
      accentClassName:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
    },
    {
      key: "in-progress",
      title: "In progress",
      subtitle: "Complaints currently handled by the department",
      complaints: inProgressComplaints,
      accentClassName:
        "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200",
    },
    {
      key: "resolved",
      title: "Resolved complaints",
      subtitle: "Closed complaints and official closure notes",
      complaints: resolvedComplaints,
      accentClassName:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
    },
    {
      key: "rejected",
      title: "Rejected complaints",
      subtitle: "Complaints that were reviewed but not accepted",
      complaints: rejectedComplaints,
      accentClassName:
        "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
    },
  ];

  const hasVisibleComplaints = complaintSections.some(
    (section) => section.complaints.length > 0,
  );

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Loader label="Loading your complaints..." className="min-h-[40vh]" />
      </section>
    );
  }

  const renderComplaintGroup = (
    title: string,
    subtitle: string,
    complaintsForSection: Complaint[],
    accentClassName: string,
  ) => (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-civic-teal">
            {title}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {subtitle}
          </h2>
        </div>

        <span
          className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] ${accentClassName}`}
        >
          {complaintsForSection.length} total
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {complaintsForSection.length ? (
          complaintsForSection.map((complaint) => {
            const latestRemark = [...complaint.remarks].sort(
              (left, right) =>
                new Date(right.createdAt).getTime() -
                new Date(left.createdAt).getTime(),
            )[0];

            return (
              <div
                key={complaint._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <ComplaintCard complaint={complaint} showTimeline />

                <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Admin remarks
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {complaint.remarks.length
                            ? `${complaint.remarks.length} official update${complaint.remarks.length === 1 ? "" : "s"} available for this complaint.`
                            : "No official remarks have been added yet."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRemarksComplaint(complaint)}
                        className="rounded-full border border-civic-blue px-4 py-2 text-sm font-semibold text-civic-blue transition hover:bg-civic-blue hover:text-white"
                      >
                        {complaint.remarks.length
                          ? "Open remarks"
                          : "View remarks"}
                      </button>
                    </div>

                    {latestRemark ? (
                      <div className="mt-4 rounded-xl bg-white p-4 text-sm shadow-sm dark:bg-slate-950">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            Latest remark from {latestRemark.authorName}
                          </p>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                            {new Date(latestRemark.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <p className="mt-3 leading-6 text-slate-600 dark:text-slate-300">
                          {latestRemark.message}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4">
                  {complaint.status === "Pending" ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-900 dark:bg-blue-950/30">
                      <p className="font-semibold text-blue-900 dark:text-blue-200">
                        Complaint is still editable
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        You can update description, category, image, or location
                        before the department begins field work.
                      </p>
                      <Link
                        to={`/submit?complaintId=${complaint.complaintId}`}
                        className="mt-2 w-fit rounded-full bg-civic-blue px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                      >
                        Update Complaint
                      </Link>
                    </div>
                  ) : null}

                  {complaint.status === "In Progress" ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
                      <p className="font-semibold text-amber-900 dark:text-amber-200">
                        Department is currently working on this complaint
                      </p>
                      <p className="mt-1 text-slate-700 dark:text-slate-300">
                        Editing has been disabled while the issue is under
                        review or field work.
                      </p>
                    </div>
                  ) : null}

                  {complaint.status === "Resolved" ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
                      <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                        Complaint successfully resolved
                      </p>
                      <p className="mt-1 text-slate-700 dark:text-slate-300">
                        Check the admin remarks for resolution notes or actions
                        taken.
                      </p>
                    </div>
                  ) : null}

                  {complaint.status === "Rejected" ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30">
                      <p className="font-semibold text-rose-900 dark:text-rose-200">
                        Complaint was rejected after review
                      </p>
                      <p className="mt-1 text-slate-700 dark:text-slate-300">
                        Review the latest admin remarks and notifications for
                        the rejection reason and next steps.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              No complaints available
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Complaints submitted by you will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
          Citizen Dashboard
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl font-bold leading-tight text-slate-900 dark:text-slate-100">
              Centralized Complaint Tracking & Resolution Management
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Monitor the complete lifecycle of your submitted complaints—from
              initial review and assignment to resolution or closure. Stay
              informed with real-time status updates and receive instant
              notifications whenever there are changes from the administrative
              team.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-5 py-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Your Complaints
            </p>

            <p className="mt-1 text-slate-600 dark:text-slate-300">
              You have submitted {complaints.length} complaint
              {complaints.length !== 1 && "s"}.
            </p>
          </div>
        </div>
      </div>

      {user?.isSuspended ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <p className="font-semibold">Account suspended</p>
          <p className="mt-1">
            {user.suspensionReason ||
              "Your account has been suspended because of multiple false complaints."}
          </p>
          <p className="mt-1">
            Rejected complaints counted: {user.falseComplaintCount || 0}
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Pending"
          value={statTrends.pending.value}
          trend={statTrends.pending.trend}
          direction={statTrends.pending.direction}
          trendLabel="this week"
          tone="orange"
          description="Pending complaint activity for your account this week."
        />
        <StatsCard
          label="In Progress"
          value={statTrends.inProgress.value}
          trend={statTrends.inProgress.trend}
          direction={statTrends.inProgress.direction}
          trendLabel="this week"
          tone="blue"
          description="Complaints moved through active work this week."
        />
        <StatsCard
          label="Resolved"
          value={statTrends.resolved.value}
          trend={statTrends.resolved.trend}
          direction={statTrends.resolved.direction}
          trendLabel="this week"
          tone="green"
          description="Complaints resolved for you this week."
        />
        <StatsCard
          label="Rejected"
          value={statTrends.rejected.value}
          trend={statTrends.rejected.trend}
          direction={statTrends.rejected.direction}
          trendLabel="this week"
          tone="orange"
          description="Complaints rejected for your account this week."
        />
      </div>

      <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={filters.query}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                query: event.target.value,
              }))
            }
            placeholder="Search by complaint ID, title, location, or keywords"
          />
          <select
            value={filters.category}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
          >
            <option value="">All categories</option>
            <option value="garbage">Garbage</option>
            <option value="water">Water</option>
            <option value="electricity">Electricity</option>
            <option value="road">Road</option>
            <option value="drainage">Drainage</option>
          </select>
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select
            value={filters.remarks}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                remarks: event.target.value,
              }))
            }
          >
            <option value="">All remarks</option>
            <option value="with-remarks">With admin remarks</option>
            <option value="without-remarks">Without admin remarks</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>{complaints.length} complaints found</p>
          {filterLoading ? (
            <p>Refreshing complaints...</p>
          ) : (
            <p>
              Use filters to focus on specific complaints and admin updates.
            </p>
          )}
        </div>
      </div>

      <div className="mt-10 space-y-10">
        {filterLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Loader
              label="Refreshing your complaint list..."
              className="py-10"
            />
          </div>
        ) : hasVisibleComplaints ? (
          complaintSections
            .filter(
              (section) => !filters.status || section.complaints.length > 0,
            )
            .map((section) =>
              renderComplaintGroup(
                section.title,
                section.subtitle,
                section.complaints,
                section.accentClassName,
              ),
            )
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              No complaints matched your filters
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Try clearing one or more filters to bring complaints back into
              view.
            </p>
          </div>
        )}
      </div>

      <RemarksModal
        remarks={selectedRemarksComplaint?.remarks || []}
        complaintTitle={selectedRemarksComplaint?.title}
        isOpen={Boolean(selectedRemarksComplaint)}
        onClose={() => setSelectedRemarksComplaint(null)}
      />
    </section>
  );
};

export default CitizenDashboard;
