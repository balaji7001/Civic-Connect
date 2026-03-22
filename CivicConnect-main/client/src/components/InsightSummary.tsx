import { useMemo } from "react";

import type { Complaint } from "../services/api";
import { isClosedComplaint } from "../utils/complaints";

type InsightSummaryProps = {
  complaints: Complaint[];
};

type InsightCardTone = "red" | "green" | "yellow" | "blue" | "slate";

type InsightCard = {
  key: string;
  icon: string;
  title: string;
  value: string;
  detail: string;
  tone: InsightCardTone;
};

const toneClasses: Record<InsightCardTone, string> = {
  red: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100",
  green: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
  yellow: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
  blue: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100",
  slate: "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
};

const getWeekStart = (value: Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date;
};

const formatDuration = (milliseconds: number) => {
  const totalHours = milliseconds / (1000 * 60 * 60);

  if (totalHours < 24) {
    return `${Math.round(totalHours)}h`;
  }

  const totalDays = totalHours / 24;
  return `${totalDays.toFixed(totalDays >= 10 ? 0 : 1)}d`;
};

const formatPercent = (value: number) => `${Math.round(value)}%`;

const formatHourLabel = (hour: number) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric" });
};

const getLocationLabel = (complaint: Complaint) => {
  const addressPart = complaint.address.split(",")[0]?.trim();
  return addressPart || "Unknown location";
};

const getResolutionTimestamp = (complaint: Complaint) => {
  const candidate = complaint.resolvedAt || complaint.updatedAt;
  const timestamp = Date.parse(candidate);
  return Number.isNaN(timestamp) ? null : timestamp;
};

const InsightSummary = ({ complaints }: InsightSummaryProps) => {
  const insights = useMemo(() => {
    const now = Date.now();
    const thisWeekStart = getWeekStart(new Date());
    const nextWeekStart = new Date(thisWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    let overdueCount = 0;
    let resolvedCount = 0;
    let resolvedWithinSlaCount = 0;
    let totalResolutionTime = 0;
    let thisWeekCount = 0;
    let lastWeekCount = 0;

    const locationCounts = new Map<string, number>();
    const departmentResolution = new Map<string, { total: number; count: number }>();
    const timeBucketCounts = Array.from({ length: 8 }, (_, index) => ({ startHour: index * 3, count: 0 }));

    for (const complaint of complaints) {
      const createdTimestamp = Date.parse(complaint.createdAt);
      const slaTimestamp = Date.parse(complaint.slaDeadline);

      if (!Number.isNaN(createdTimestamp)) {
        const createdDate = new Date(createdTimestamp);
        if (createdDate >= thisWeekStart && createdDate < nextWeekStart) {
          thisWeekCount += 1;
        } else if (createdDate >= lastWeekStart && createdDate < thisWeekStart) {
          lastWeekCount += 1;
        }

        const bucketIndex = Math.floor(createdDate.getHours() / 3);
        timeBucketCounts[bucketIndex].count += 1;
      }

      const locationLabel = getLocationLabel(complaint);
      locationCounts.set(locationLabel, (locationCounts.get(locationLabel) || 0) + 1);

      if (!isClosedComplaint(complaint.status) && !Number.isNaN(slaTimestamp) && now > slaTimestamp) {
        overdueCount += 1;
      }

      if (complaint.status !== "Resolved") {
        continue;
      }

      const resolutionTimestamp = getResolutionTimestamp(complaint);
      if (resolutionTimestamp === null || Number.isNaN(createdTimestamp) || resolutionTimestamp < createdTimestamp) {
        continue;
      }

      const resolutionTime = resolutionTimestamp - createdTimestamp;
      resolvedCount += 1;
      totalResolutionTime += resolutionTime;

      if (!Number.isNaN(slaTimestamp) && resolutionTimestamp <= slaTimestamp) {
        resolvedWithinSlaCount += 1;
      }

      const departmentKey = complaint.department || "Unassigned";
      const departmentEntry = departmentResolution.get(departmentKey) || { total: 0, count: 0 };
      departmentEntry.total += resolutionTime;
      departmentEntry.count += 1;
      departmentResolution.set(departmentKey, departmentEntry);
    }

    const resolutionPerformance = resolvedCount ? (resolvedWithinSlaCount / resolvedCount) * 100 : 0;
    const averageResolutionTime = resolvedCount ? totalResolutionTime / resolvedCount : null;

    const hotspot = Array.from(locationCounts.entries()).sort((left, right) => right[1] - left[1])[0] || null;

    const trendPercent = lastWeekCount
      ? ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100
      : thisWeekCount > 0
        ? 100
        : 0;
    const trendDirection = thisWeekCount === lastWeekCount ? "flat" : thisWeekCount > lastWeekCount ? "up" : "down";

    const departmentAverages = Array.from(departmentResolution.entries())
      .map(([department, metrics]) => ({ department, average: metrics.total / metrics.count }))
      .sort((left, right) => left.average - right.average);

    const fastestDepartment = departmentAverages[0] || null;
    const slowestDepartment = departmentAverages[departmentAverages.length - 1] || null;
    const busiestTimeBucket = timeBucketCounts.sort((left, right) => right.count - left.count)[0];

    const cards: InsightCard[] = [
      {
        key: "sla-risk",
        icon: "⚠️",
        title: "SLA Risk Alert",
        value: `${overdueCount} complaints are overdue`,
        detail: overdueCount
          ? `These complaints have crossed their SLA deadline and still remain active.`
          : "No active complaints are currently overdue.",
        tone: overdueCount > 5 ? "red" : overdueCount > 0 ? "yellow" : "green",
      },
      {
        key: "resolution-performance",
        icon: "✅",
        title: "Resolution Performance",
        value: resolvedCount ? `${formatPercent(resolutionPerformance)} resolved within SLA` : "No resolved complaints yet",
        detail: resolvedCount
          ? `${resolvedWithinSlaCount} of ${resolvedCount} resolved complaints were closed before their SLA deadline.`
          : "This metric will appear once complaints have been resolved.",
        tone: resolutionPerformance >= 75 ? "green" : resolutionPerformance >= 50 ? "yellow" : "red",
      },
      {
        key: "avg-resolution",
        icon: "⏱️",
        title: "Average Resolution Time",
        value: averageResolutionTime !== null ? formatDuration(averageResolutionTime) : "Not available yet",
        detail: averageResolutionTime !== null
          ? `Calculated from complaint creation to final resolution timestamp.`
          : "Waiting for enough resolved complaints with valid timestamps.",
        tone: averageResolutionTime !== null && averageResolutionTime <= 24 * 60 * 60 * 1000 ? "green" : "blue",
      },
      {
        key: "hotspot",
        icon: "📍",
        title: "Location Hotspot",
        value: hotspot ? `${hotspot[0]} has highest complaints (${hotspot[1]})` : "No location hotspot available",
        detail: hotspot
          ? `Based on the highest complaint concentration from the current complaint addresses.`
          : "Location insight will appear once complaint addresses are available.",
        tone: hotspot && hotspot[1] >= 5 ? "yellow" : "blue",
      },
      {
        key: "department-efficiency",
        icon: "🏢",
        title: "Department Efficiency",
        value: fastestDepartment && slowestDepartment
          ? `${fastestDepartment.department} fastest, ${slowestDepartment.department} slowest`
          : "Not enough resolved data yet",
        detail: fastestDepartment && slowestDepartment
          ? `Average resolution time: ${fastestDepartment.department} ${formatDuration(fastestDepartment.average)} vs ${slowestDepartment.department} ${formatDuration(slowestDepartment.average)}.`
          : "Department comparison will appear when multiple departments have resolved complaints.",
        tone: fastestDepartment && slowestDepartment ? "green" : "slate",
      },
      {
        key: "peak-time",
        icon: "🕒",
        title: "Peak Complaint Time",
        value: busiestTimeBucket.count
          ? `Most complaints occur between ${formatHourLabel(busiestTimeBucket.startHour)}-${formatHourLabel((busiestTimeBucket.startHour + 3) % 24)}`
          : "No peak time available",
        detail: busiestTimeBucket.count
          ? `${busiestTimeBucket.count} complaints were created during this three-hour window.`
          : "Peak reporting time will appear once complaint timestamps are available.",
        tone: busiestTimeBucket.count >= 5 ? "yellow" : "blue",
      },
    ];

    return cards;
  }, [complaints]);

  return (
    <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Insight summary</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Read the current operational picture at a glance</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          These insight cards are computed directly from the live complaint records already loaded into the admin dashboard.
        </p>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {insights.map((card) => (
          <article key={card.key} className={`rounded-[1.5rem] border p-5 shadow-sm ${toneClasses[card.tone]}`}>
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-white/70 text-2xl shadow-sm dark:bg-slate-950/40">
                <span aria-hidden="true">{card.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.16em]">{card.title}</p>
                <p className="mt-3 text-xl font-bold leading-8">{card.value}</p>
                <p className="mt-2 text-sm leading-6 opacity-80">{card.detail}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default InsightSummary;
