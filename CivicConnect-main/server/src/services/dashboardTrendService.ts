import { Types } from "mongoose";

import { ComplaintModel } from "../models/Complaint";
import { calculateTrend, type TrendMetric } from "../utils/calculateTrend";

const CLOSED_STATUSES = ["Resolved", "Rejected"] as const;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type Period = {
  start: Date;
  end: Date;
};

const getTrendPeriods = () => {
  const now = new Date();
  const currentStart = new Date(now.getTime() - 7 * DAY_IN_MS);
  const previousStart = new Date(now.getTime() - 14 * DAY_IN_MS);
  const previousEnd = currentStart;

  return {
    current: { start: currentStart, end: now },
    previous: { start: previousStart, end: previousEnd },
  };
};

const buildPeriodFilter = (field: "createdAt" | "updatedAt", period: Period) => ({
  [field]: {
    $gte: period.start,
    $lt: period.end,
  },
});

const countComplaintsForPeriod = async ({
  period,
  field,
  filters = {},
}: {
  period: Period;
  field: "createdAt" | "updatedAt";
  filters?: Record<string, unknown>;
}) => {
  return ComplaintModel.countDocuments({
    ...filters,
    ...buildPeriodFilter(field, period),
  });
};

const buildTrendMetricFromCounts = async ({
  current,
  previous,
}: {
  current: Promise<number>;
  previous: Promise<number>;
}): Promise<TrendMetric> => {
  const [currentValue, previousValue] = await Promise.all([current, previous]);
  return calculateTrend(currentValue, previousValue);
};

const getAverageResolutionHoursForPeriod = async ({
  period,
  citizenId,
}: {
  period: Period;
  citizenId?: string;
}) => {
  const matchStage: Record<string, unknown> = {
    status: "Resolved",
    ...buildPeriodFilter("updatedAt", period),
  };

  if (citizenId) {
    matchStage.citizenId = new Types.ObjectId(citizenId);
  }

  const result = await ComplaintModel.aggregate([
    { $match: matchStage },
    {
      $project: {
        resolutionHours: {
          $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, 1000 * 60 * 60],
        },
      },
    },
    {
      $group: {
        _id: null,
        averageHours: { $avg: "$resolutionHours" },
      },
    },
  ]);

  return Math.round(result[0]?.averageHours ?? 0);
};

const getRemarkCountForCitizenPeriod = async ({
  citizenId,
  period,
}: {
  citizenId: string;
  period: Period;
}) => {
  const result = await ComplaintModel.aggregate([
    {
      $match: {
        citizenId: new Types.ObjectId(citizenId),
      },
    },
    { $unwind: "$remarks" },
    {
      $match: {
        "remarks.createdAt": {
          $gte: period.start,
          $lt: period.end,
        },
      },
    },
    { $count: "count" },
  ]);

  return result[0]?.count ?? 0;
};

export const getAdminDashboardTrendMetrics = async () => {
  const periods = getTrendPeriods();

  const [total, pending, inProgress, resolved, rejected] = await Promise.all([
    buildTrendMetricFromCounts({
      current: countComplaintsForPeriod({ period: periods.current, field: "createdAt" }),
      previous: countComplaintsForPeriod({ period: periods.previous, field: "createdAt" }),
    }),
    buildTrendMetricFromCounts({
      current: countComplaintsForPeriod({ period: periods.current, field: "updatedAt", filters: { status: "Pending" } }),
      previous: countComplaintsForPeriod({ period: periods.previous, field: "updatedAt", filters: { status: "Pending" } }),
    }),
    buildTrendMetricFromCounts({
      current: countComplaintsForPeriod({ period: periods.current, field: "updatedAt", filters: { status: "In Progress" } }),
      previous: countComplaintsForPeriod({ period: periods.previous, field: "updatedAt", filters: { status: "In Progress" } }),
    }),
    buildTrendMetricFromCounts({
      current: countComplaintsForPeriod({ period: periods.current, field: "updatedAt", filters: { status: "Resolved" } }),
      previous: countComplaintsForPeriod({ period: periods.previous, field: "updatedAt", filters: { status: "Resolved" } }),
    }),
    buildTrendMetricFromCounts({
      current: countComplaintsForPeriod({ period: periods.current, field: "updatedAt", filters: { status: "Rejected" } }),
      previous: countComplaintsForPeriod({ period: periods.previous, field: "updatedAt", filters: { status: "Rejected" } }),
    }),
  ]);

  return {
    total,
    pending,
    inProgress,
    resolved,
    rejected,
  };
};

export const getPublicDashboardTrendMetrics = async () => {
  const periods = getTrendPeriods();

  const [cityFeed, resolved, active, avgHours] = await Promise.all([
    buildTrendMetricFromCounts({
      current: countComplaintsForPeriod({ period: periods.current, field: "createdAt" }),
      previous: countComplaintsForPeriod({ period: periods.previous, field: "createdAt" }),
    }),
    buildTrendMetricFromCounts({
      current: countComplaintsForPeriod({ period: periods.current, field: "updatedAt", filters: { status: "Resolved" } }),
      previous: countComplaintsForPeriod({ period: periods.previous, field: "updatedAt", filters: { status: "Resolved" } }),
    }),
    buildTrendMetricFromCounts({
      current: countComplaintsForPeriod({ period: periods.current, field: "updatedAt", filters: { status: { $nin: CLOSED_STATUSES } } }),
      previous: countComplaintsForPeriod({ period: periods.previous, field: "updatedAt", filters: { status: { $nin: CLOSED_STATUSES } } }),
    }),
    (async () => {
      const [current, previous] = await Promise.all([
        getAverageResolutionHoursForPeriod({ period: periods.current }),
        getAverageResolutionHoursForPeriod({ period: periods.previous }),
      ]);
      return calculateTrend(current, previous);
    })(),
  ]);

  return {
    cityFeed,
    resolved,
    active,
    avgHours,
  };
};

export const getCitizenDashboardTrendMetrics = async (citizenId: string) => {
  const periods = getTrendPeriods();
  const citizenFilter = { citizenId: new Types.ObjectId(citizenId) };

  const [pending, inProgress, resolved, rejected, updates] = await Promise.all([
    buildTrendMetricFromCounts({
      current: countComplaintsForPeriod({ period: periods.current, field: "updatedAt", filters: { ...citizenFilter, status: "Pending" } }),
      previous: countComplaintsForPeriod({ period: periods.previous, field: "updatedAt", filters: { ...citizenFilter, status: "Pending" } }),
    }),
    buildTrendMetricFromCounts({
      current: countComplaintsForPeriod({ period: periods.current, field: "updatedAt", filters: { ...citizenFilter, status: "In Progress" } }),
      previous: countComplaintsForPeriod({ period: periods.previous, field: "updatedAt", filters: { ...citizenFilter, status: "In Progress" } }),
    }),
    buildTrendMetricFromCounts({
      current: countComplaintsForPeriod({ period: periods.current, field: "updatedAt", filters: { ...citizenFilter, status: "Resolved" } }),
      previous: countComplaintsForPeriod({ period: periods.previous, field: "updatedAt", filters: { ...citizenFilter, status: "Resolved" } }),
    }),
    buildTrendMetricFromCounts({
      current: countComplaintsForPeriod({ period: periods.current, field: "updatedAt", filters: { ...citizenFilter, status: "Rejected" } }),
      previous: countComplaintsForPeriod({ period: periods.previous, field: "updatedAt", filters: { ...citizenFilter, status: "Rejected" } }),
    }),
    (async () => {
      const [current, previous] = await Promise.all([
        getRemarkCountForCitizenPeriod({ citizenId, period: periods.current }),
        getRemarkCountForCitizenPeriod({ citizenId, period: periods.previous }),
      ]);
      return calculateTrend(current, previous);
    })(),
  ]);

  return {
    pending,
    inProgress,
    resolved,
    rejected,
    updates,
  };
};
