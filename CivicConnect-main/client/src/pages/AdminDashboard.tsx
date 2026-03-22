import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiTrendingUp } from "react-icons/fi";

import AdminNavbar from "../components/AdminNavbar";
import CommandCenter from "../components/CommandCenter";
import { type AdminView } from "../components/AdminViewSelector";
import ComplaintDetailsModal from "../components/ComplaintDetailsModal";
import ComplaintQueue from "../components/ComplaintQueue";
import ImageLightbox from "../components/ImageLightbox";
import InsightSummary from "../components/InsightSummary";
import MapView from "../components/MapView";
import Loader from "../components/Loader";
import StatsCard from "../components/StatsCard";
import { useToast } from "../hooks/useToast";
import api, {
  extractApiError,
  type AnalyticsPoint,
  type Complaint,
  type Department,
  type SeverityPoint,
  type TrendMetric,
} from "../services/api";
import { isClosedComplaint } from "../utils/complaints";

const formatTrendLabel = (label?: string) => {
  if (!label) {
    return "Unknown";
  }

  const [year, month] = label.split("-").map(Number);
  if (!year || !month) {
    return label;
  }

  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
};

type AdminDashboardTrends = {
  total: TrendMetric;
  pending: TrendMetric;
  inProgress: TrendMetric;
  resolved: TrendMetric;
  rejected: TrendMetric;
};

const emptyTrendMetric: TrendMetric = {
  value: 0,
  current: 0,
  previous: 0,
  trend: 0,
  direction: "neutral",
};

const AdminDashboard = () => {
  const { showToast } = useToast();
  const [view, setView] = useState<AdminView>("command");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [slaViolations, setSlaViolations] = useState<Complaint[]>([]);
  const [trendStats, setTrendStats] = useState<AnalyticsPoint[]>([]);
  const [dashboardTrends, setDashboardTrends] =
    useState<AdminDashboardTrends | null>(null);
  const [severityStats, setSeverityStats] = useState<SeverityPoint[]>([]);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    priority: "",
  });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [manageDepartment, setManageDepartment] = useState("");
  const [remark, setRemark] = useState("");
  const [pendingStatus, setPendingStatus] =
    useState<Complaint["status"]>("Pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    Complaint["status"] | null
  >(null);
  const [error, setError] = useState("");
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.category) params.set("category", filters.category);
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      const queryString = params.toString();

      const [
        complaintResponse,
        departmentResponse,
        violationResponse,
        trendResponse,
        dashboardTrendResponse,
        severityResponse,
      ] = await Promise.all([
        api.get<{ data: Complaint[] }>(
          `/admin/complaints${queryString ? `?${queryString}` : ""}`,
        ),
        api.get<{ data: Department[] }>("/admin/departments"),
        api.get<{ data: Complaint[] }>("/admin/sla-violations"),
        api.get<{ data: AnalyticsPoint[] }>("/analytics/trends"),
        api.get<{ data: AdminDashboardTrends }>("/admin/dashboard-trends"),
        api.get<{ data: SeverityPoint[] }>("/analytics/severity"),
      ]);

      setComplaints(complaintResponse.data.data);
      setDepartments(departmentResponse.data.data);
      setSlaViolations(violationResponse.data.data);
      setTrendStats(trendResponse.data.data);
      setDashboardTrends(dashboardTrendResponse.data.data);
      setSeverityStats(severityResponse.data.data);
    } catch (loadError) {
      setError(extractApiError(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [filters.category, filters.priority, filters.status]);

  useEffect(() => {
    if (!selectedComplaint) {
      return;
    }

    const refreshedComplaint =
      complaints.find((complaint) => complaint._id === selectedComplaint._id) ??
      null;
    if (!refreshedComplaint) {
      setSelectedComplaint(null);
      return;
    }

    if (refreshedComplaint !== selectedComplaint) {
      setSelectedComplaint(refreshedComplaint);
    }
  }, [complaints, selectedComplaint]);

  useEffect(() => {
    if (selectedComplaint) {
      setManageDepartment(
        selectedComplaint.department || departments[0]?.name || "",
      );
      setPendingStatus(selectedComplaint.status);
    } else {
      setManageDepartment(departments[0]?.name || "");
      setPendingStatus("Pending");
    }

    setRemark("");
  }, [departments, selectedComplaint]);

  useEffect(() => {
    if (
      view !== "queue" &&
      view !== "resolved" &&
      view !== "rejected" &&
      view !== "command"
    ) {
      setSelectedComplaint(null);
    }
  }, [view]);

  const submitComplaintUpdate = async () => {
    if (!selectedComplaint) {
      return;
    }

    if (isClosedComplaint(selectedComplaint.status)) {
      const message =
        selectedComplaint.status === "Resolved"
          ? "Resolved complaints can no longer be updated."
          : "Rejected complaints can no longer be updated.";
      setError(message);
      showToast({ tone: "info", title: "Read-only complaint", message });
      return;
    }

    const status = pendingStatus || selectedComplaint.status;

    setActionLoading(status);
    setError("");

    try {
      await api.patch(
        `/admin/complaints/${selectedComplaint.complaintId}/manage`,
        {
          department: manageDepartment,
          status,
          remark,
        },
      );

      await loadDashboard();
      showToast({
        tone: "success",
        title: `Complaint marked ${status}`,
        message: `${selectedComplaint.title} has been updated successfully.`,
      });
      setSelectedComplaint(null);
      setRemark("");
    } catch (saveError) {
      const message = extractApiError(saveError);
      setError(message);
      showToast({ tone: "error", title: "Action failed", message });
    } finally {
      setActionLoading(null);
    }
  };

  const queueComplaints = complaints.filter(
    (complaint) => !isClosedComplaint(complaint.status),
  );
  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "Resolved",
  );
  const rejectedComplaints = complaints.filter(
    (complaint) => complaint.status === "Rejected",
  );
  const openComplaints = complaints.filter(
    (complaint) => !isClosedComplaint(complaint.status),
  );
  const activeComplaints = openComplaints;

  const priorityDistribution = useMemo(
    () => [
      {
        label: "High",
        count: complaints.filter((complaint) => complaint.priority === "High")
          .length,
      },
      {
        label: "Medium",
        count: complaints.filter((complaint) => complaint.priority === "Medium")
          .length,
      },
      {
        label: "Low",
        count: complaints.filter((complaint) => complaint.priority === "Low")
          .length,
      },
    ],
    [complaints],
  );

  const departmentWorkload = useMemo(() => {
    const counts = complaints.reduce<Record<string, number>>(
      (accumulator, complaint) => {
        const key = complaint.department || "Unassigned";
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      },
      {},
    );

    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }, [complaints]);

  const severityBandData = useMemo(
    () => [
      {
        label: "Critical",
        count: complaints.filter((complaint) => complaint.severityScore >= 80)
          .length,
      },
      {
        label: "High",
        count: complaints.filter(
          (complaint) =>
            complaint.severityScore >= 60 && complaint.severityScore < 80,
        ).length,
      },
      {
        label: "Moderate",
        count: complaints.filter(
          (complaint) =>
            complaint.severityScore >= 40 && complaint.severityScore < 60,
        ).length,
      },
      {
        label: "Low",
        count: complaints.filter((complaint) => complaint.severityScore < 40)
          .length,
      },
    ],
    [complaints],
  );

  const slaRiskData = useMemo(() => {
    const now = Date.now();

    return activeComplaints.reduce(
      (accumulator, complaint) => {
        const diffHours =
          (new Date(complaint.slaDeadline).getTime() - now) / (1000 * 60 * 60);

        if (diffHours <= 0) {
          accumulator[0].count += 1;
        } else if (diffHours <= 24) {
          accumulator[1].count += 1;
        } else if (diffHours <= 48) {
          accumulator[2].count += 1;
        } else {
          accumulator[3].count += 1;
        }

        return accumulator;
      },
      [
        { label: "Overdue", count: 0 },
        { label: "Due <24h", count: 0 },
        { label: "Due 24-48h", count: 0 },
        { label: "On Track", count: 0 },
      ],
    );
  }, [activeComplaints]);

  const formattedTrendStats = useMemo(
    () =>
      trendStats.map((item) => ({
        ...item,
        formattedLabel: formatTrendLabel(item.label),
      })),
    [trendStats],
  );

  const latestTrendPoint = formattedTrendStats[formattedTrendStats.length - 1];
  const previousTrendPoint =
    formattedTrendStats[formattedTrendStats.length - 2];
  const trendDelta =
    latestTrendPoint && previousTrendPoint
      ? latestTrendPoint.count - previousTrendPoint.count
      : 0;
  const averageTrendCount = formattedTrendStats.length
    ? Math.round(
        formattedTrendStats.reduce((sum, item) => sum + item.count, 0) /
          formattedTrendStats.length,
      )
    : 0;

  const statTrends = dashboardTrends || {
    total: emptyTrendMetric,
    pending: emptyTrendMetric,
    inProgress: emptyTrendMetric,
    resolved: emptyTrendMetric,
    rejected: emptyTrendMetric,
  };

  if (loading && !complaints.length) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Loader label="Loading admin dashboard..." className="min-h-[40vh]" />
      </section>
    );
  }

  let activeSection: JSX.Element;

  switch (view) {
    case "queue":
      activeSection = (
        <>
          <ComplaintQueue
            complaints={queueComplaints}
            loading={loading}
            onSelectComplaint={setSelectedComplaint}
            selectedComplaintId={selectedComplaint?._id ?? null}
          />
          <ComplaintDetailsModal
            complaint={selectedComplaint}
            departments={departments}
            manageDepartment={manageDepartment}
            remark={remark}
            selectedStatus={pendingStatus}
            actionLoading={actionLoading !== null}
            onDepartmentChange={setManageDepartment}
            onRemarkChange={setRemark}
            onStatusChange={setPendingStatus}
            onClose={() => setSelectedComplaint(null)}
            onSubmit={() => void submitComplaintUpdate()}
            onOpenImage={setLightboxImage}
          />
        </>
      );
      break;
    case "resolved":
      activeSection = (
        <>
          <ComplaintQueue
            complaints={resolvedComplaints}
            loading={loading}
            onSelectComplaint={setSelectedComplaint}
            selectedComplaintId={selectedComplaint?._id ?? null}
            title="Resolved complaints"
            description="Browse complaints that have already been completed and reopen the admin control modal when you need full context or remark history."
            emptyMessage="No resolved complaints are available right now."
            itemLabel="resolved"
            showMap={false}
          />
          <ComplaintDetailsModal
            complaint={selectedComplaint}
            departments={departments}
            manageDepartment={manageDepartment}
            remark={remark}
            selectedStatus={pendingStatus}
            actionLoading={actionLoading !== null}
            onDepartmentChange={setManageDepartment}
            onRemarkChange={setRemark}
            onStatusChange={setPendingStatus}
            onClose={() => setSelectedComplaint(null)}
            onSubmit={() => void submitComplaintUpdate()}
            onOpenImage={setLightboxImage}
          />
        </>
      );
      break;
    case "rejected":
      activeSection = (
        <>
          <ComplaintQueue
            complaints={rejectedComplaints}
            loading={loading}
            onSelectComplaint={setSelectedComplaint}
            selectedComplaintId={selectedComplaint?._id ?? null}
            title="Rejected complaints"
            description="Review complaints that were rejected, along with the reason history and supporting evidence, without reopening them for edits."
            emptyMessage="No rejected complaints are available right now."
            itemLabel="rejected"
            showMap={false}
          />
          <ComplaintDetailsModal
            complaint={selectedComplaint}
            departments={departments}
            manageDepartment={manageDepartment}
            remark={remark}
            selectedStatus={pendingStatus}
            actionLoading={actionLoading !== null}
            onDepartmentChange={setManageDepartment}
            onRemarkChange={setRemark}
            onStatusChange={setPendingStatus}
            onClose={() => setSelectedComplaint(null)}
            onSubmit={() => void submitComplaintUpdate()}
            onOpenImage={setLightboxImage}
          />
        </>
      );
      break;
    case "workflow":
      activeSection = (
        <div className="mt-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="max-w-3xl">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
                Workflow Intelligence
              </p>

              <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
                Monitor Complaint Flow & Team Performance
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Real-time overview of workload distribution, processing status,
                and operational bottlenecks.
              </p>
            </div>

            {/* MAIN METRICS */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Open */}
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  Open
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {openComplaints.length}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Active complaints
                </p>
              </div>

              {/* In Progress */}
              <div className="rounded-2xl bg-blue-50 p-5 dark:bg-blue-950/30">
                <p className="text-xs uppercase text-blue-500">In Progress</p>
                <p className="mt-2 text-2xl font-bold text-blue-700">
                  {complaints.filter((c) => c.status === "In Progress").length}
                </p>
                <p className="mt-1 text-sm text-blue-600">Being handled</p>
              </div>

              {/* Pending */}
              <div className="rounded-2xl bg-amber-50 p-5 dark:bg-amber-950/30">
                <p className="text-xs uppercase text-amber-500">Pending</p>
                <p className="mt-2 text-2xl font-bold text-amber-700">
                  {complaints.filter((c) => c.status === "Pending").length}
                </p>
                <p className="mt-1 text-sm text-amber-600">
                  Awaiting assignment
                </p>
              </div>

              {/* Resolved */}
              <div className="rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-950/30">
                <p className="text-xs uppercase text-emerald-500">Resolved</p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">
                  {complaints.filter((c) => c.status === "Resolved").length}
                </p>
                <p className="mt-1 text-sm text-emerald-600">Completed cases</p>
              </div>

              {/* Rejected */}
              <div className="rounded-2xl bg-rose-50 p-5 dark:bg-rose-950/30">
                <p className="text-xs uppercase text-rose-500">Rejected</p>
                <p className="mt-2 text-2xl font-bold text-rose-700">
                  {complaints.filter((c) => c.status === "Rejected").length}
                </p>
                <p className="mt-1 text-sm text-rose-600">
                  Invalid / duplicate
                </p>
              </div>

              {/* SLA Risk */}
              <div className="rounded-2xl bg-red-50 p-5 dark:bg-red-950/30">
                <p className="text-xs uppercase text-red-500">SLA Risk</p>
                <p className="mt-2 text-2xl font-bold text-red-700">
                  {
                    complaints.filter(
                      (c) =>
                        !isClosedComplaint(c.status) &&
                        new Date(c.slaDeadline).getTime() < Date.now(),
                    ).length
                  }
                </p>
                <p className="mt-1 text-sm text-red-600">Overdue complaints</p>
              </div>
            </div>

            {/* EXTRA INSIGHTS */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Resolution Rate */}
              <div className="rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-950/30">
                <p className="text-xs uppercase text-emerald-500">
                  Resolution Rate
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">
                  {complaints.length
                    ? Math.round(
                        (complaints.filter((c) => c.status === "Resolved")
                          .length /
                          complaints.length) *
                          100,
                      )
                    : 0}
                  %
                </p>
                <p className="mt-1 text-sm text-emerald-600">
                  Completion efficiency
                </p>
              </div>

              {/* Avg Resolution Time */}
              <div className="rounded-2xl bg-indigo-50 p-5 dark:bg-indigo-950/30">
                <p className="text-xs uppercase text-indigo-500">
                  Avg Resolution
                </p>
                <p className="mt-2 text-2xl font-bold text-indigo-700">
                  {(() => {
                    const resolved = complaints.filter(
                      (c) => c.status === "Resolved",
                    );
                    if (!resolved.length) return "—";

                    const avg =
                      resolved.reduce(
                        (sum, c) =>
                          sum +
                          (new Date(c.updatedAt).getTime() -
                            new Date(c.createdAt).getTime()),
                        0,
                      ) / resolved.length;

                    const hours = Math.round(avg / (1000 * 60 * 60));
                    return hours < 24
                      ? `${hours}h`
                      : `${Math.floor(hours / 24)}d`;
                  })()}
                </p>
                <p className="mt-1 text-sm text-indigo-600">
                  Avg resolution time
                </p>
              </div>

              {/* Department Load */}
              <div className="rounded-2xl bg-sky-50 p-5 dark:bg-sky-950/30">
                <p className="text-xs uppercase text-sky-500">Highest Load</p>
                <p className="mt-2 text-lg font-bold text-sky-700">
                  {(() => {
                    const map: Record<string, number> = {};
                    complaints.forEach((c) => {
                      const key = c.department || "Unassigned";
                      map[key] = (map[key] || 0) + 1;
                    });
                    const top = Object.entries(map).sort(
                      (a, b) => b[1] - a[1],
                    )[0];
                    return top ? `${top[0]} (${top[1]})` : "—";
                  })()}
                </p>
                <p className="mt-1 text-sm text-sky-600">
                  Most loaded department
                </p>
              </div>

              {/* Bottleneck */}
              <div className="rounded-2xl bg-rose-50 p-5 dark:bg-rose-950/30">
                <p className="text-xs uppercase text-rose-500">Bottleneck</p>
                <p className="mt-2 text-lg font-bold text-rose-700">
                  {complaints.filter((c) => c.status === "Pending").length > 10
                    ? "Pending Overload"
                    : "No bottleneck"}
                </p>
                <p className="mt-1 text-sm text-rose-600">
                  Workflow congestion
                </p>
              </div>

              {/* SLA Compliance */}
              <div className="rounded-2xl bg-green-50 p-5 dark:bg-green-950/30">
                <p className="text-xs uppercase text-green-500">
                  SLA Compliance
                </p>
                <p className="mt-2 text-2xl font-bold text-green-700">
                  {(() => {
                    const resolved = complaints.filter(
                      (c) => c.status === "Resolved",
                    );
                    const within = resolved.filter(
                      (c) =>
                        new Date(c.updatedAt).getTime() <=
                        new Date(c.slaDeadline).getTime(),
                    );
                    return resolved.length
                      ? Math.round((within.length / resolved.length) * 100) +
                          "%"
                      : "—";
                  })()}
                </p>
                <p className="mt-1 text-sm text-green-600">Within SLA</p>
              </div>
            </div>

            {/* INSIGHT */}
            <div className="mt-6 rounded-2xl border bg-slate-50 p-5 dark:bg-slate-950/40">
              <p className="text-sm font-semibold">⚡ Operational Insight</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {(() => {
                  const open = openComplaints.length;
                  const pending = complaints.filter(
                    (c) => c.status === "Pending",
                  ).length;
                  const overdue = complaints.filter(
                    (c) =>
                      !isClosedComplaint(c.status) &&
                      new Date(c.slaDeadline).getTime() < Date.now(),
                  ).length;
                  const resolved = complaints.filter(
                    (c) => c.status === "Resolved",
                  ).length;

                  if (overdue > 10) {
                    return "🚨 Critical: High number of overdue complaints. Immediate action required to prevent SLA breaches.";
                  }

                  if (pending > 15) {
                    return "⚠️ Bottleneck detected in pending queue. Assign resources to reduce backlog.";
                  }

                  if (open > 25) {
                    return "📈 Workload spike detected. Consider redistributing complaints across departments.";
                  }

                  if (resolved > open) {
                    return "✅ Strong performance: Resolution rate is exceeding incoming workload.";
                  }

                  if (overdue > 0) {
                    return "⏱ Some complaints are nearing SLA limits. Monitor and prioritize accordingly.";
                  }

                  return "🟢 Workflow is stable. All systems operating within expected thresholds.";
                })()}
              </p>
            </div>
          </div>
        </div>
      );
      break;
    case "sla":
      activeSection = (
        <>
          <div className="mt-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.28em] text-rose-500">
                    SLA Violations
                  </p>
                  <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Overdue Complaint Alerts
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    These complaints have crossed SLA deadlines and need
                    immediate attention.
                  </p>
                </div>

                {/* Alert Badge */}
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-rose-100 px-4 py-2 text-xs sm:text-sm font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                    🚨 {slaViolations.length} Active Alerts
                  </span>
                </div>
              </div>

              {/* List */}
              <div className="mt-6 space-y-4">
                {slaViolations.length ? (
                  slaViolations.map((complaint) => {
                    const diffMs =
                      Date.now() - new Date(complaint.slaDeadline).getTime();

                    const overdueDays = Math.floor(
                      diffMs / (1000 * 60 * 60 * 24),
                    );
                    const overdueHours = Math.floor(diffMs / (1000 * 60 * 60));

                    let overdueText = "";

                    if (overdueDays >= 1) {
                      overdueText = `${overdueDays} day${overdueDays !== 1 ? "s" : ""} overdue`;
                    } else {
                      overdueText = `${overdueHours} hr${overdueHours !== 1 ? "s" : ""} overdue`;
                    }

                    return (
                      <button
                        key={complaint._id}
                        type="button"
                        onClick={() => setSelectedComplaint(complaint)} // ✅ FIXED
                        className="group w-full cursor-pointer text-left rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-1 dark:border-rose-900/50 dark:from-rose-950/30 dark:to-slate-900"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* LEFT */}
                          <div>
                            <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">
                              {complaint.complaintId}
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                              {complaint.title}
                            </p>

                            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                              {complaint.department}
                            </p>
                          </div>

                          {/* RIGHT */}
                          <div className="flex flex-col sm:items-end gap-2">
                            <span className="rounded-full bg-rose-200 px-3 py-1 text-xs font-semibold text-rose-900 dark:bg-rose-900/60 dark:text-rose-100">
                              {overdueText}
                            </span>

                            <p className="text-[10px] sm:text-xs text-slate-500">
                              Deadline:{" "}
                              {new Date(complaint.slaDeadline).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-3 flex justify-end">
                          <span className="text-xs font-semibold text-rose-600 opacity-0 group-hover:opacity-100 transition">
                            View details →
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-xs sm:text-sm text-center text-slate-500 dark:border-slate-700">
                    🎉 No SLA violations — everything is on track!
                  </div>
                )}
              </div>
            </div>
          </div>
          <ComplaintDetailsModal
            complaint={selectedComplaint}
            departments={departments}
            manageDepartment={manageDepartment}
            remark={remark}
            selectedStatus={pendingStatus}
            actionLoading={actionLoading !== null}
            onDepartmentChange={setManageDepartment}
            onRemarkChange={setRemark}
            onStatusChange={setPendingStatus}
            onClose={() => setSelectedComplaint(null)}
            onSubmit={() => void submitComplaintUpdate()}
            onOpenImage={setLightboxImage}
          />
        </>
      );
      break;
    case "map":
      activeSection = (
        <div className="mt-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
                Geo Intelligence
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                Visualize Complaint Hotspots Across the City
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Analyze complaint distribution in real time, identify
                high-density problem areas, and detect emerging clusters. Use
                these insights to prioritize actions, allocate resources
                efficiently, and respond faster where it matters most.
              </p>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
              <MapView complaints={complaints} heightClassName="h-[32rem]" />
            </div>
          </div>
        </div>
      );
      break;
    case "severity":
      activeSection = (
        <>
          <div className="mt-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              {/* Header */}
              <div className="max-w-3xl">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
                  Priority Intelligence
                </p>

                <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Focus on High-Impact Complaints First
                </h2>

                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Complaints are ranked by severity score to help prioritize
                  urgent issues and allocate resources effectively.
                </p>
              </div>

              {/* List */}
              <div className="mt-6 space-y-4">
                {severityStats.length ? (
                  severityStats.map((item) => {
                    // 🔥 Severity Logic
                    const isCritical = item.severityScore >= 80;
                    const isHigh = item.severityScore >= 60;
                    const isMedium = item.severityScore >= 40;

                    const severityColor = isCritical
                      ? "bg-red-500"
                      : isHigh
                        ? "bg-orange-500"
                        : isMedium
                          ? "bg-yellow-500"
                          : "bg-green-500";

                    const severityLabel = isCritical
                      ? "Critical"
                      : isHigh
                        ? "High"
                        : isMedium
                          ? "Moderate"
                          : "Low";

                    return (
                      <button
                        key={item.complaintId}
                        onClick={() =>
                          setSelectedComplaint(
                            complaints.find(
                              (c) => c.complaintId === item.complaintId,
                            ) || null,
                          )
                        }
                        className="group w-full text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/40"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* LEFT */}
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {item.complaintId}
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                              {item.title}
                            </p>

                            <p className="mt-1 text-xs sm:text-sm text-slate-500">
                              {item.category} • {item.priority} • {item.status}
                            </p>
                          </div>

                          {/* RIGHT */}
                          <div className="flex flex-col sm:items-end gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${severityColor}`}
                            >
                              {severityLabel}
                            </span>

                            <p className="text-xs font-semibold text-slate-500">
                              Score: {item.severityScore}
                            </p>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-3 flex justify-end">
                          <span className="text-xs text-civic-teal opacity-0 group-hover:opacity-100 transition">
                            View details →
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-xs sm:text-sm text-center text-slate-500 dark:border-slate-700">
                    No severity data available yet.
                  </div>
                )}
              </div>
            </div>
          </div>
          <ComplaintDetailsModal
            complaint={selectedComplaint}
            departments={departments}
            manageDepartment={manageDepartment}
            remark={remark}
            selectedStatus={pendingStatus}
            actionLoading={actionLoading !== null}
            onDepartmentChange={setManageDepartment}
            onRemarkChange={setRemark}
            onStatusChange={setPendingStatus}
            onClose={() => setSelectedComplaint(null)}
            onSubmit={() => void submitComplaintUpdate()}
            onOpenImage={setLightboxImage}
          />
        </>
      );
      break;
    case "insights":
      activeSection = <InsightSummary complaints={complaints} />;
      break;
    case "command":
    default:
      activeSection = (
        <>
          <CommandCenter
            complaints={complaints}
            selectedComplaintId={selectedComplaint?._id ?? null}
            onSelectComplaint={setSelectedComplaint}
            onPrepareAction={(complaint, status) => {
              setSelectedComplaint(complaint);
              setPendingStatus(status);
            }}
          />
          <ComplaintDetailsModal
            complaint={selectedComplaint}
            departments={departments}
            manageDepartment={manageDepartment}
            remark={remark}
            selectedStatus={pendingStatus}
            actionLoading={actionLoading !== null}
            onDepartmentChange={setManageDepartment}
            onRemarkChange={setRemark}
            onStatusChange={setPendingStatus}
            onClose={() => setSelectedComplaint(null)}
            onSubmit={() => void submitComplaintUpdate()}
            onOpenImage={setLightboxImage}
          />
        </>
      );
      break;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <AdminNavbar view={view} onViewChange={setView} />

      {view === "queue" ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="admin-filter-category"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Category
              </label>
              <select
                id="admin-filter-category"
                value={filters.category}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                className="mt-2"
              >
                <option value="">All categories</option>
                <option value="garbage">Garbage</option>
                <option value="water">Water</option>
                <option value="electricity">Electricity</option>
                <option value="road">Road</option>
                <option value="drainage">Drainage</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-filter-status"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Status
              </label>
              <select
                id="admin-filter-status"
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
                className="mt-2"
              >
                <option value="">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-filter-priority"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Priority
              </label>
              <select
                id="admin-filter-priority"
                value={filters.priority}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    priority: event.target.value,
                  }))
                }
                className="mt-2"
              >
                <option value="">All priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {activeSection}

      <ImageLightbox
        imageUrl={lightboxImage?.url}
        title={lightboxImage?.title}
        isOpen={Boolean(lightboxImage)}
        onClose={() => setLightboxImage(null)}
      />
    </section>
  );
};

export default AdminDashboard;
