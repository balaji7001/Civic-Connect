export type TrendDirection = "up" | "down" | "neutral";

export interface TrendMetric {
  value: number;
  current: number;
  previous: number;
  trend: number;
  direction: TrendDirection;
}

export const calculateTrend = (current: number, previous: number): TrendMetric => {
  if (!previous) {
    return {
      value: current,
      current,
      previous,
      trend: 0,
      direction: "neutral",
    };
  }

  const trend = ((current - previous) / previous) * 100;

  return {
    value: current,
    current,
    previous,
    trend: Number(trend.toFixed(1)),
    direction: trend > 0 ? "up" : trend < 0 ? "down" : "neutral",
  };
};
