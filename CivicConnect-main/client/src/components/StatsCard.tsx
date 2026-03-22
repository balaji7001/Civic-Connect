export type TrendDirection = "up" | "down" | "neutral";

interface StatsCardProps {
  label: string;
  value: string | number;
  tone: "blue" | "green" | "orange" | "teal";
  description: string;
  trend?: number;
  direction?: TrendDirection;
  trendLabel?: string;
}

const toneStyles = {
  blue: "from-civic-blue to-sky-600",
  green: "from-civic-green to-emerald-500",
  orange: "from-civic-orange to-amber-500",
  teal: "from-civic-teal to-cyan-500",
};

const trendStyles: Record<TrendDirection, string> = {
  up: "text-green-500",
  down: "text-red-500",
  neutral: "text-gray-400",
};

const StatsCard = ({
  label,
  value,
  tone,
  description,
  trend,
  direction = "neutral",
  trendLabel = "vs last week",
}: StatsCardProps) => {
  const formattedTrend = typeof trend === "number" ? Math.abs(trend).toFixed(1).replace(/\.0$/, "") : null;
  const trendPrefix = direction === "up" ? "\u2191" : direction === "down" ? "\u2193" : "";

  return (
    <section className="rounded-xl border border-white/20 bg-white/80 p-5 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className={`inline-flex rounded-full bg-gradient-to-r ${toneStyles[tone]} px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white`}>
        {label}
      </div>
      <p className="mt-5 text-4xl font-black text-slate-900 dark:text-slate-100">{value}</p>
      {formattedTrend !== null ? (
        <div className={`mt-3 flex items-center gap-1 text-sm font-semibold ${trendStyles[direction]}`}>
          <span>{trendPrefix ? `${trendPrefix} ${formattedTrend}%` : `${formattedTrend}%`}</span>
          <span>{trendLabel}</span>
        </div>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </section>
  );
};

export default StatsCard;

