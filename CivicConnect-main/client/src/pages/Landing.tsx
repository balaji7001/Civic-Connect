import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ComplaintCard from "../components/ComplaintCard";
import StatsCard from "../components/StatsCard";
import Loader from "../components/Loader";
import MapView from "../components/MapView";
import api, { extractApiError, type AnalyticsPoint, type Complaint, type TrendMetric } from "../services/api";
import { isClosedComplaint } from "../utils/complaints";
import { useAuth } from "../hooks/useAuth";
import { FiMapPin, FiCpu, FiGitBranch, FiCheckCircle } from "react-icons/fi";
import {
  FiGlobe,
  FiLink,
  FiUsers,
  FiShield,
  FiChevronRight,
} from "react-icons/fi";

const featureCards = [
  {
    title: "AI Complaint Classification",
    description:
      "Complaints are automatically categorized using machine learning so they are routed to the correct municipal department instantly.",
  },
  {
    title: "Priority & Severity Detection",
    description:
      "AI evaluates urgency, sentiment, and complaint patterns to assign priority levels and identify high-impact civic issues.",
  },
  {
    title: "Live Civic Map Visualization",
    description:
      "Complaints are displayed on an interactive map using GPS coordinates, helping administrators identify issue hotspots across the city.",
  },
  {
    title: "SLA Deadline Monitoring",
    description:
      "Each complaint receives a resolution deadline, allowing administrators to track service performance and prevent overdue cases.",
  },
  {
    title: "Public Transparency Portal",
    description:
      "Citizens can view complaints, track resolution progress, and monitor municipal response times through a public dashboard.",
  },
  {
    title: "Administrator Command Dashboard",
    description:
      "Municipal officials can assign departments, update complaint statuses, and monitor city-wide service operations in one centralized system.",
  },
];

const processSteps = [
  "Citizens submit a complaint with description, image evidence, and automatic GPS location capture.",
  "The AI processing engine analyzes the complaint to detect category, urgency, sentiment, and possible duplicates.",
  "The complaint is routed to the responsible municipal department and assigned a resolution deadline (SLA).",
  "Administrators track progress, update status, and resolve the issue while citizens monitor updates in real time.",
];

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

type PublicDashboardTrends = {
  cityFeed: TrendMetric;
  resolved: TrendMetric;
  active: TrendMetric;
  avgHours: TrendMetric;
};

const emptyTrendMetric: TrendMetric = {
  value: 0,
  current: 0,
  previous: 0,
  trend: 0,
  direction: "neutral",
};

const Landing = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categoryStats, setCategoryStats] = useState<AnalyticsPoint[]>([]);
  const [trendStats, setTrendStats] = useState<AnalyticsPoint[]>([]);
  const [wardStats, setWardStats] = useState<AnalyticsPoint[]>([]);
  const [publicTrends, setPublicTrends] = useState<PublicDashboardTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [complaintsResponse, categoryResponse, trendResponse, wardResponse, publicTrendResponse] = await Promise.all([
          api.get<{ data: Complaint[] }>("/complaints"),
          api.get<{ data: AnalyticsPoint[] }>("/analytics/category"),
          api.get<{ data: AnalyticsPoint[] }>("/analytics/trends"),
          api.get<{ data: AnalyticsPoint[] }>("/analytics/wards"),
          api.get<{ data: PublicDashboardTrends }>("/public/stats/trends"),
        ]);

        setComplaints(complaintsResponse.data.data);
        setCategoryStats(categoryResponse.data.data);
        setTrendStats(trendResponse.data.data);
        setWardStats(wardResponse.data.data);
        setPublicTrends(publicTrendResponse.data.data);
        setError("");
      } catch (loadError) {
        setError(extractApiError(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const resolvedCount = complaints.filter((complaint) => complaint.status === "Resolved").length;
  const activeCount = complaints.filter((complaint) => !isClosedComplaint(complaint.status)).length;
  const avgResolutionHours = complaints.length
    ? Math.round(
        complaints.reduce((sum, complaint) => {
          const resolutionWindow = new Date(complaint.updatedAt).getTime() - new Date(complaint.createdAt).getTime();
          return sum + resolutionWindow / (1000 * 60 * 60);
        }, 0) / complaints.length,
      )
    : 0;

  const topComplaints = useMemo(() => {
    return [...complaints]
      .filter((complaint) => complaint.status === "Pending" || complaint.status === "In Progress")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [complaints]);

  const formattedTrendStats = useMemo(
    () => trendStats.map((item) => ({ ...item, formattedLabel: formatTrendLabel(item.label) })),
    [trendStats],
  );

  const latestTrendPoint = formattedTrendStats[formattedTrendStats.length - 1];
  const previousTrendPoint = formattedTrendStats[formattedTrendStats.length - 2];
  const trendDelta = latestTrendPoint && previousTrendPoint ? latestTrendPoint.count - previousTrendPoint.count : 0;
  const peakTrendPoint = formattedTrendStats.reduce<AnalyticsPoint & { formattedLabel?: string } | null>((peak, current) => {
    if (!peak || current.count > peak.count) {
      return current;
    }
    return peak;
  }, null);

  const statTrends = publicTrends || {
    cityFeed: emptyTrendMetric,
    resolved: emptyTrendMetric,
    active: emptyTrendMetric,
    avgHours: emptyTrendMetric,
  };

  const { isAuthenticated } = useAuth();

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Loader label="Loading public dashboard..." className="min-h-[50vh]" />
      </section>
    );
  }

  return (
    <div>
      <section
        className="relative bg-cover bg-center text-white"
        style={{
          backgroundImage: "url('/images/hero2.png')",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.32em] text-blue-200">AI-Powered Civic Governance Platform</p>

            <h1 className="max-w-3xl font-serif text-5xl font-bold leading-tight md:text-6xl">
              Report civic issues, track resolutions, and bring
              <span className="text-civic-teal"> transparency</span> to city services.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Civic Connect enables citizens to report local issues, while municipal departments prioritize and resolve complaints using
              AI-driven analysis, SLA monitoring, and real-time civic analytics.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/submit"
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-civic-blue shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                Report Complaint
              </Link>

              <Link
                to="/complaints"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:scale-105 hover:border-white hover:bg-white/10"
              >
                Browse Complaints
              </Link>
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="mx-auto mt-6 max-w-7xl rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}

      <section className="mx-auto max-w-7xl px-6 py-5">
        <div className="border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">City Overview</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-slate-100">Civic Complaint Statistics</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard label="City Feed" value={statTrends.cityFeed.value} trend={statTrends.cityFeed.trend} direction={statTrends.cityFeed.direction} trendLabel="this week" tone="blue" description="Citizen-submitted civic complaints visible to the public." />
            <StatsCard label="Resolved" value={statTrends.resolved.value} trend={statTrends.resolved.trend} direction={statTrends.resolved.direction} trendLabel="this week" tone="green" description="Issues marked resolved by municipal departments." />
            <StatsCard label="Active" value={statTrends.active.value} trend={statTrends.active.trend} direction={statTrends.active.direction} trendLabel="this week" tone="orange" description="Open complaints still moving through the workflow." />
            <StatsCard label="Avg Hours" value={statTrends.avgHours.value} trend={statTrends.avgHours.trend} direction={statTrends.avgHours.direction} trendLabel="faster resolution" tone="teal" description="Average resolution window across tracked complaints." />
          </div>
        </div>
      </section>

      {/* <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Trend analysis</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-slate-100">How complaint volume is moving over time</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
                See whether complaint submissions are rising or cooling off across recent reporting periods, and where the biggest spikes have occurred.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Latest period</p>
              <p className="mt-1">{latestTrendPoint?.formattedLabel || "No trend data yet"}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.75rem] bg-slate-50 p-5 dark:bg-slate-950/60">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedTrendStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedLabel" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Complaints" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Current momentum</p>
                <p className="mt-2">
                  {latestTrendPoint
                    ? trendDelta > 0
                      ? `${trendDelta} more complaints were submitted in ${latestTrendPoint.formattedLabel} than in the previous period.`
                      : trendDelta < 0
                        ? `${Math.abs(trendDelta)} fewer complaints were submitted in ${latestTrendPoint.formattedLabel} than in the previous period.`
                        : `Complaint volume in ${latestTrendPoint.formattedLabel} matched the previous period.`
                    : "Trend momentum will appear once complaint history is available."}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Peak reporting period</p>
                <p className="mt-2">
                  {peakTrendPoint
                    ? `${peakTrendPoint.formattedLabel} recorded the highest visible complaint volume with ${peakTrendPoint.count} submissions.`
                    : "Peak period insights will appear once trend data is available."}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Coverage</p>
                <p className="mt-2">
                  {formattedTrendStats.length
                    ? `The dashboard is currently analyzing ${formattedTrendStats.length} reporting periods for public trend visibility.`
                    : "No reporting periods are available yet."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">About Civic Connect</p>
          <h2 className="mt-2 font-serif text-4xl font-bold">A smarter way to manage civic complaints</h2>

          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Civic Connect combines citizen reporting, AI-powered complaint analysis, geolocation mapping, and municipal workflow management to
            create a transparent and efficient civic service platform.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature, index) => (
            <article key={feature.title} className="border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-civic-teal">{String(index + 1).padStart(2, "0")} Feature</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Complaint feed</p>
            <h2 className="mt-2 font-serif text-4xl font-bold">Latest civic issues across the city</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/complaints"
              className="rounded-full border border-civic-blue px-5 py-3 text-sm font-bold text-civic-blue transition-all duration-200 hover:bg-civic-blue hover:text-white hover:shadow-md"
            >
              View all complaints
            </Link>

            {!isAuthenticated ? (
              <Link
                to="/register"
                className="rounded-full bg-civic-blue px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
              >
                Join as Citizen
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {topComplaints.map((complaint) => (
            <ComplaintCard key={complaint._id} complaint={complaint} />
          ))}
        </div>
      </section>

      <section id="city-map" className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">City Complaint Map</p>
          <h2 className="mt-2 font-serif text-4xl font-bold">Real-time map of civic issues across the city</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Civic Connect visualizes complaints on an interactive city map using GPS-based location data. This helps identify issue hotspots, reduce
            duplicate reports, and allows municipal departments to respond faster to problems in specific areas.
          </p>
        </div>

        <MapView complaints={complaints} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">How it works</p>
          <h2 className="mt-2 font-serif text-4xl font-bold">From complaint submission to resolution</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Civic Connect streamlines the entire civic complaint lifecycle using AI-powered analysis, automated routing, and transparent tracking so
            both citizens and administrators can monitor issues until resolution.
          </p>
        </div>

        <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
          {processSteps.map((step, index) => {
            const icons = [<FiMapPin size={28} />, <FiCpu size={28} />, <FiGitBranch size={28} />, <FiCheckCircle size={28} />];

            return (
              <div key={index} className="flex items-center">
                <article className="flex h-full min-h-[260px] w-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4 text-civic-teal">{icons[index]}</div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-civic-orange">Step {index + 1}</p>
                  <p className="mt-4 flex-grow text-sm leading-7 text-slate-600 dark:text-slate-300">{step}</p>
                </article>

                {index < processSteps.length - 1 ? <div className="hidden items-center justify-center px-4 text-2xl text-slate-400 xl:flex">?</div> : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-8">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-civic-blue to-civic-teal p-8 text-white shadow-soft md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100">Public participation</p>
          <h2 className="mt-3 font-serif text-4xl font-bold">See the city clearly. Report what matters. Track what changes.</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-cyan-50">
            Civic Connect turns civic complaints into visible, measurable action. Explore the public feed, report a new issue, or sign in to
            track your own cases.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/complaints"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-civic-blue transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-md"
            >
              Explore Complaints
            </Link>

            <Link
              to="/submit"
              className="rounded-full border border-white/35 px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-civic-blue hover:shadow-md"
            >
              Report an Issue
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-20 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-10 py-16">
          <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-civic-teal">
                <FiGlobe size={20} />
                <h3 className="font-serif text-xl font-bold">Civic Connect</h3>
              </div>

              <p className="text-justify text-sm leading-6 text-slate-600 dark:text-slate-400">
                Civic Connect is an AI-powered civic complaint management platform designed to improve transparency, efficiency, and accountability in
                municipal services. Citizens can report civic issues and track complaint resolution in real time.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-civic-teal">
                <FiLink size={18} />
                <h4 className="text-sm font-semibold uppercase tracking-wider">Quick Links</h4>
              </div>

              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2 transition hover:text-civic-teal">
                  <FiChevronRight size={14} />
                  <Link to="/">Home</Link>
                </li>

                <li className="flex items-center gap-2 transition hover:text-civic-teal">
                  <FiChevronRight size={14} />
                  <Link to="/complaints">Public Complaints</Link>
                </li>

                <li className="flex items-center gap-2 transition hover:text-civic-teal">
                  <FiChevronRight size={14} />
                  <Link to="/submit">Report Civic Issue</Link>
                </li>

                <li className="flex items-center gap-2 transition hover:text-civic-teal">
                  <FiChevronRight size={14} />
                  <Link to="/dashboard">Citizen Dashboard</Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 text-civic-teal">
                <FiUsers size={18} />
                <h4 className="text-sm font-semibold uppercase tracking-wider">Citizen Services</h4>
              </div>

              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link to="/dashboard" className="transition hover:text-civic-teal">
                    Complaint Tracking
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link to="/dashboard" className="transition hover:text-civic-teal">
                    Service Requests
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link to="/dashboard" className="transition hover:text-civic-teal">
                    Ward Analytics
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link to="/dashboard" className="transition hover:text-civic-teal">
                    Public Transparency Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 text-civic-teal">
                <FiShield size={18} />
                <h4 className="text-sm font-semibold uppercase tracking-wider">Policies</h4>
              </div>

              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link to="/policies#privacy" className="transition hover:text-civic-teal">
                    Privacy Policy
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link to="/policies#terms" className="transition hover:text-civic-teal">
                    Terms of Service
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link to="/policies#accessibility" className="transition hover:text-civic-teal">
                    Accessibility Statement
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link to="/policies#security" className="transition hover:text-civic-teal">
                    Security Policy
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link to="/policies#disclaimer" className="transition hover:text-civic-teal">
                    Disclaimer
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-6xl border-t border-slate-200 pt-6 dark:border-slate-800">
            <div className="flex flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
              <p className="text-sm text-slate-500 dark:text-slate-400">� {new Date().getFullYear()} Civic Connect</p>

              <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <FiShield size={14} className="text-civic-teal" />
                Smart City Civic Governance Platform
              </p>
            </div>

            <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
              Information on this portal is published for civic transparency and public awareness.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;





