import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiPlayCircle,
  FiRefreshCw,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
Aoaf4kalevcc6 cwowlx6 wk5ffd6el
import type { Complaint } from "../services/api";
import { complaintStatusTone, isClosedComplaint } from "../utils/complaints";

type QuickActionStatus = "In Progress" | "Resolved" | "Rejected";

type CommandCenterProps = {
  complaints: Complaint[];
  selectedComplaintId?: string | null;
  onSelectComplaint: (complaint: Complaint) => void;
  onPrepareAction: (complaint: Complaint, status: QuickActionStatus) => void;
};

type ActivityItem = {
  id: string;
  action: string;
  detail: string;
  timestamp: number;
  complaint: Complaint;
};

type DepartmentLoad = {
  name: string;
  total: number;
  active: number;
  overdue: number;
  overloaded: boolean;
};

const getPriorityWeight = (priority: Complaint["priority"]) => {
  switch (priority) {
    case "High":
      return 3;
    case "Medium":
      return 2;
    default:
      return 1;
  }
};

const sortByUrgency = (left: Complaint, right: Complaint) => {
  const leftDeadline = Date.parse(left.slaDeadline);
  const rightDeadline = Date.parse(right.slaDeadline);

  if (
    !Number.isNaN(leftDeadline) &&
    !Number.isNaN(rightDeadline) &&
    leftDeadline !== rightDeadline
  ) {
    return leftDeadline - rightDeadline;
  }

  const priorityGap =
    getPriorityWeight(right.priority) - getPriorityWeight(left.priority);
  if (priorityGap !== 0) {
    return priorityGap;
  }

  return Date.parse(right.createdAt) - Date.parse(left.createdAt);
};

const pickRandomComplaint = (
  complaints: Complaint[],
  excludeId?: string | null,
) => {
  if (!complaints.length) {
    return null;
  }

  const filtered = excludeId
    ? complaints.filter((complaint) => complaint._id !== excludeId)
    : complaints;
  const source = filtered.length ? filtered : complaints;
  const index = Math.floor(Math.random() * source.length);
  return source[index] ?? null;
};

const formatRelativeWindow = (milliseconds: number) => {
  const absolute = Math.abs(milliseconds);
  const totalMinutes = Math.round(absolute / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (totalHours > 0) {
    return `${totalHours}h ${minutes}m`;
  }

  return `${Math.max(minutes, 1)}m`;
};

const formatAbsoluteTime = (value: string) => {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return "Unknown time";
  }

  return new Date(timestamp).toLocaleString();
};

const buildLastSevenDays = () => {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      count: 0,
    };
  });
};

const CommandCenter = ({
  complaints,
  selectedComplaintId,
  onSelectComplaint,
  onPrepareAction,
}: CommandCenterProps) => {
  const selectedComplaint = useMemo(
    () =>
      complaints.find((complaint) => complaint._id === selectedComplaintId) ??
      null,
    [complaints, selectedComplaintId],
  );

  const dashboardData = useMemo(() => {
    const now = Date.now();
    const recentTrend = buildLastSevenDays();
    const trendLookup = new Map(recentTrend.map((item) => [item.key, item]));

    const activeComplaints: Complaint[] = [];
    const overdueComplaints: Complaint[] = [];
    const highPriorityPending: Complaint[] = [];
    const dueWithin24Hours: Complaint[] = [];
    const recentUpdates: Complaint[] = [];
    const activity: ActivityItem[] = [];
    const departmentMap = new Map<
      string,
      { total: number; active: number; overdue: number }
    >();

    for (const complaint of complaints) {
      const createdTimestamp = Date.parse(complaint.createdAt);
      const updatedTimestamp = Date.parse(complaint.updatedAt);
      const deadlineTimestamp = Date.parse(complaint.slaDeadline);
      const active = !isClosedComplaint(complaint.status);

      if (!Number.isNaN(createdTimestamp)) {
        const dayKey = new Date(createdTimestamp).toISOString().slice(0, 10);
        const trendPoint = trendLookup.get(dayKey);
        if (trendPoint) {
          trendPoint.count += 1;
        }

        activity.push({
          id: `${complaint._id}-created`,
          action: "Complaint created",
          detail: `${complaint.complaintId} was submitted in ${complaint.department || "the intake queue"}.`,
          timestamp: createdTimestamp,
          complaint,
        });
      }

      if (
        !Number.isNaN(updatedTimestamp) &&
        !Number.isNaN(createdTimestamp) &&
        updatedTimestamp > createdTimestamp
      ) {
        activity.push({
          id: `${complaint._id}-updated`,
          action: "Status updated",
          detail: `${complaint.complaintId} is currently ${complaint.status}.`,
          timestamp: updatedTimestamp,
          complaint,
        });
      }

      recentUpdates.push(complaint);

      const departmentKey = complaint.department || "Unassigned";
      const currentDepartment = departmentMap.get(departmentKey) || {
        total: 0,
        active: 0,
        overdue: 0,
      };
      currentDepartment.total += 1;

      if (active) {
        currentDepartment.active += 1;
        activeComplaints.push(complaint);

        if (!Number.isNaN(deadlineTimestamp) && deadlineTimestamp < now) {
          overdueComplaints.push(complaint);
          currentDepartment.overdue += 1;
        } else if (
          !Number.isNaN(deadlineTimestamp) &&
          deadlineTimestamp - now <= 24 * 60 * 60 * 1000
        ) {
          dueWithin24Hours.push(complaint);
        }
      }

      if (complaint.priority === "High" && complaint.status === "Pending") {
        highPriorityPending.push(complaint);
      }

      departmentMap.set(departmentKey, currentDepartment);
    }

    overdueComplaints.sort(sortByUrgency);
    highPriorityPending.sort(sortByUrgency);
    dueWithin24Hours.sort(sortByUrgency);
    recentUpdates.sort(
      (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
    );
    activity.sort((left, right) => right.timestamp - left.timestamp);

    const averageActiveLoad = departmentMap.size
      ? activeComplaints.length / departmentMap.size
      : 0;

    const departmentLoad: DepartmentLoad[] = Array.from(departmentMap.entries())
      .map(([name, counts]) => ({
        name,
        total: counts.total,
        active: counts.active,
        overdue: counts.overdue,
        overloaded: counts.active > averageActiveLoad && counts.active > 0,
      }))
      .sort(
        (left, right) => right.active - left.active || right.total - left.total,
      );

    const countdownComplaints = [...activeComplaints]
      .filter((complaint) => !Number.isNaN(Date.parse(complaint.slaDeadline)))
      .sort(
        (left, right) =>
          Date.parse(left.slaDeadline) - Date.parse(right.slaDeadline),
      )
      .slice(0, 5);

    return {
      recentTrend,
      activeComplaints,
      overdueComplaints,
      highPriorityPending,
      dueWithin24Hours,
      liveActivity: activity.slice(0, 8),
      countdownComplaints,
      recentUpdates: recentUpdates.slice(0, 5),
      departmentLoad,
      primaryComplaint:
        overdueComplaints[0] ||
        dueWithin24Hours[0] ||
        highPriorityPending[0] ||
        [...activeComplaints].sort(sortByUrgency)[0] ||
        null,
    };
  }, [complaints]);

  const [randomComplaintId, setRandomComplaintId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const currentRandomExists = dashboardData.activeComplaints.some(
      (complaint) => complaint._id === randomComplaintId,
    );

    if (!currentRandomExists) {
      const nextComplaint = pickRandomComplaint(dashboardData.activeComplaints);
      setRandomComplaintId(nextComplaint?._id ?? null);
    }
  }, [dashboardData.activeComplaints, randomComplaintId]);

  const randomQuickActionComplaint = useMemo(
    () =>
      dashboardData.activeComplaints.find(
        (complaint) => complaint._id === randomComplaintId,
      ) ?? null,
    [dashboardData.activeComplaints, randomComplaintId],
  );

  const activeSelection =
    selectedComplaint && !isClosedComplaint(selectedComplaint.status)
      ? selectedComplaint
      : randomQuickActionComplaint || dashboardData.primaryComplaint;

  const handleShuffleQuickActionComplaint = () => {
    const nextComplaint = pickRandomComplaint(
      dashboardData.activeComplaints,
      activeSelection?._id ?? null,
    );
    if (nextComplaint) {
      setRandomComplaintId(nextComplaint._id);
    }
  };

  const priorityCards = [
    {
      key: "overdue",
      title: "Overdue complaints",
      count: dashboardData.overdueComplaints.length,
      description: "Already past SLA and still active.",
      tone: dashboardData.overdueComplaints.length
        ? "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20"
        : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900",
      target: dashboardData.overdueComplaints[0] || null,
      buttonLabel: "Open next overdue",
      icon: (
        <FiAlertTriangle
          className="text-rose-600 dark:text-rose-300"
          size={18}
        />
      ),
    },
    {
      key: "high-priority",
      title: "High priority pending",
      count: dashboardData.highPriorityPending.length,
      description: "High-priority complaints awaiting first action.",
      tone: dashboardData.highPriorityPending.length
        ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20"
        : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900",
      target: dashboardData.highPriorityPending[0] || null,
      buttonLabel: "Open next high priority",
      icon: (
        <FiShield className="text-amber-600 dark:text-amber-300" size={18} />
      ),
    },
    {
      key: "due-soon",
      title: "Due within 24 hours",
      count: dashboardData.dueWithin24Hours.length,
      description: "Active complaints approaching their SLA limit.",
      tone: dashboardData.dueWithin24Hours.length
        ? "border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/20"
        : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900",
      target: dashboardData.dueWithin24Hours[0] || null,
      buttonLabel: "Open next due soon",
      icon: <FiClock className="text-sky-600 dark:text-sky-300" size={18} />,
    },
  ];

  const quickActions: Array<{
    label: string;
    status: QuickActionStatus;
    icon: JSX.Element;
    className: string;
  }> = [
    {
      label: "Start Progress",
      status: "In Progress",
      icon: <FiPlayCircle size={16} />,
      className:
        "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200",
    },
    {
      label: "Resolve",
      status: "Resolved",
      icon: <FiCheckCircle size={16} />,
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200",
    },
    {
      label: "Reject",
      status: "Rejected",
      icon: <FiXCircle size={16} />,
      className:
        "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200",
    },
  ];

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
              Priority Actions
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
              Focus on what needs attention now
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Quickly identify overdue, high-risk, and unassigned complaints to
              take immediate action.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Quick actions target
            </p>
            <p className="mt-1">
              {activeSelection
                ? `${activeSelection.complaintId} - ${activeSelection.title}`
                : "No open complaint selected"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {priorityCards.map((card) => (
            <article
              key={card.key}
              className={`rounded-[1.5rem] border p-5 ${card.tone}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                    {card.title}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {card.count}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {card.description}
                  </p>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
                  {card.icon}
                </div>
              </div>

              <button
                type="button"
                onClick={() => card.target && onSelectComplaint(card.target)}
                disabled={!card.target}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-civic-teal hover:text-civic-teal disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {card.buttonLabel}
                <FiArrowRight size={14} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
              Quick Actions
            </p>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Instantly access an active complaint and take the next action
              without delay.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {activeSelection
                ? `Working on ${activeSelection.complaintId}`
                : "Choose an active complaint to enable quick actions."}
            </div>
            {/* <button
              type="button"
              onClick={handleShuffleQuickActionComplaint}
              disabled={dashboardData.activeComplaints.length < 2}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-civic-teal hover:text-civic-teal disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <FiRefreshCw size={15} />
              Random complaint
            </button> */}
          </div>
        </div>

        <div className="mt-4 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-300">
          {activeSelection
            ? `${activeSelection.title} · ${activeSelection.department} · SLA ${formatAbsoluteTime(activeSelection.slaDeadline)}`
            : "No active complaints are available for quick action right now."}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <button
              key={action.status}
              type="button"
              onClick={() =>
                activeSelection &&
                onPrepareAction(activeSelection, action.status)
              }
              disabled={!activeSelection}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${action.className}`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Activity Feed */}
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-start sm:items-center gap-3">
            <FiActivity className="text-civic-teal mt-1 sm:mt-0" size={18} />
            <div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
                Activity Feed
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Real-time complaint updates and actions.
              </p>
            </div>
          </div>

          {/* Feed */}
          <div className="mt-6 relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-slate-200 dark:bg-slate-800" />

            <div className="space-y-5">
              {dashboardData.liveActivity.length ? (
                dashboardData.liveActivity.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectComplaint(item.complaint)}
                    className="group relative w-full text-left"
                  >
                    <div className="flex gap-4">
                      {/* Timeline Dot */}
                      <div className="relative z-10 mt-1">
                        <div className="h-3 w-3 rounded-full bg-civic-teal ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-200 group-hover:border-slate-300 group-hover:bg-white dark:border-slate-800 dark:bg-slate-950/40 dark:group-hover:bg-slate-900">
                        {/* Top Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {item.action}
                          </p>

                          <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-[0.12em]">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>

                        {/* Detail */}
                        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                          {item.detail}
                        </p>

                        {/* Complaint Tag */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] sm:text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                            {item.complaint.title}
                          </span>

                          {/* Optional badge */}
                          <span className="text-[10px] text-slate-400">
                            Tap to view →
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-xs sm:text-sm text-center text-slate-500 dark:border-slate-700">
                  No recent activity.
                </div>
              )}
            </div>
          </div>
        </section>
        {/* SlA Deadline */}
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <FiClock className="text-civic-orange" size={18} />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
                SLA Deadlines
              </p>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Track upcoming and overdue deadlines that require immediate
                attention.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {dashboardData.countdownComplaints.length ? (
              dashboardData.countdownComplaints.map((complaint) => {
                const deadline = Date.parse(complaint.slaDeadline);
                const remaining = deadline - Date.now();
                const overdue = remaining < 0;

                return (
                  <button
                    key={complaint._id}
                    type="button"
                    onClick={() => onSelectComplaint(complaint)}
                    className={`w-full rounded-2xl border p-5 text-left transition hover:shadow-md ${
                      overdue
                        ? "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {complaint.complaintId}
                        </p>

                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                          {complaint.title}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                          complaintStatusTone[complaint.status]
                        }`}
                      >
                        {complaint.status}
                      </span>
                    </div>

                    {/* Department */}
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      {complaint.department}
                    </p>

                    {/* Divider */}
                    <div className="my-3 h-px bg-slate-200 dark:bg-slate-800" />

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm font-semibold ${
                          overdue
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {overdue
                          ? `Overdue by ${formatRelativeWindow(remaining)}`
                          : `${formatRelativeWindow(remaining)} left`}
                      </p>

                      <p className="text-xs text-slate-500">
                        {formatAbsoluteTime(complaint.slaDeadline)}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500 dark:border-slate-700">
                No active SLA deadlines are available right now.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6">
        {/* Weekly Chart */}
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiTrendingUp className="text-civic-teal" size={18} />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
                  Weekly Trend
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Complaint volume over last 7 days
                </p>
              </div>
            </div>

            {/* Optional trend badge */}
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              +12% ↑
            </span>
          </div>

          <div className="mt-6 h-56 rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-950">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.recentTrend}>
                {/* Gradient Fill */}
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>

                {/* Soft grid */}
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  strokeOpacity={0.2}
                />

                {/* X Axis */}
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  padding={{ left: 20, right: 20 }}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />

                {/* Tooltip */}
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  cursor={{ stroke: "#14b8a6", strokeWidth: 1, opacity: 0.2 }}
                />

                {/* Area */}
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#14b8a6"
                  fill="url(#colorTrend)"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#14b8a6" }}
                  activeDot={{ r: 6 }}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Department Load */}

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-start sm:items-center gap-3">
            <FiUsers className="text-civic-teal mt-1 sm:mt-0" size={18} />
            <div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
                Department Load
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Overloaded departments are flagged based on active complaints.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="mt-6 space-y-4">
            {dashboardData.departmentLoad.length ? (
              dashboardData.departmentLoad.map((department) => {
                const loadPercent = Math.min(
                  Math.round(
                    (department.active / (department.total || 1)) * 100,
                  ),
                  100,
                );

                return (
                  <div
                    key={department.name}
                    className={`group rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${
                      department.overloaded
                        ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20"
                        : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40"
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* Left */}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {department.name}
                        </p>
                        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                          {department.total} total complaints
                        </p>
                      </div>

                      {/* Right Badges */}
                      <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em]">
                        <span className="rounded-full bg-white/80 px-3 py-1 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          {department.active} active
                        </span>

                        <span className="rounded-full bg-white/80 px-3 py-1 text-red-500 dark:bg-slate-900">
                          {department.overdue} overdue
                        </span>

                        {department.overloaded && (
                          <span className="rounded-full bg-amber-200 px-3 py-1 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
                            ⚠ Overloaded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-xs sm:text-sm text-center text-slate-500 dark:border-slate-700">
                No department data yet.
              </div>
            )}
          </div>
        </section>
      </div>

<section className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
  
  {/* Header */}
  <div className="flex items-start sm:items-center gap-3">
    <FiMapPin className="text-civic-teal mt-1 sm:mt-0" size={18} />
    <div>
      <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
        Recent Updates
      </p>
      <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
        Latest complaint activity across departments.
      </p>
    </div>
  </div>

  {/* Grid */}
  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {dashboardData.recentUpdates.length ? (
      dashboardData.recentUpdates.map((complaint) => {
        const isSelected = complaint._id === selectedComplaintId;
        const closed = isClosedComplaint(complaint.status);

        return (
          <button
            key={complaint._id}
            onClick={() => onSelectComplaint(complaint)}
            className={`group rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
              isSelected
                ? "border-civic-teal ring-2 ring-civic-teal/20"
                : "border-slate-200 dark:border-slate-800"
            } ${
              closed
                ? "bg-slate-50 dark:bg-slate-950/30"
                : "bg-white dark:bg-slate-900"
            }`}
          >
            {/* Top Row */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {complaint.complaintId}
              </p>

              {/* Status dot */}
              <span
                className={`h-2 w-2 rounded-full ${
                  closed ? "bg-green-500" : "bg-amber-500"
                }`}
              />
            </div>

            {/* Title */}
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
              {complaint.title}
            </p>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold ${complaintStatusTone[complaint.status]}`}
              >
                {complaint.status}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] sm:text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {complaint.department}
              </span>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[10px] sm:text-xs text-slate-500">
                Updated {formatAbsoluteTime(complaint.updatedAt)}
              </p>

              <span className="text-[10px] text-civic-teal opacity-0 group-hover:opacity-100 transition">
                View →
              </span>
            </div>
          </button>
        );
      })
    ) : (
      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-xs sm:text-sm text-center text-slate-500 dark:border-slate-700 sm:col-span-2 lg:col-span-3 xl:col-span-4">
        No recent updates yet.
      </div>
    )}
  </div>
</section>
    </div>
  );
};

export default CommandCenter;
