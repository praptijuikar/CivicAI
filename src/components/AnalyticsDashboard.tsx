import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ThumbsUp,
  MapPin,
  Layers,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import type { AnalyticsOverview, CivicIssue } from "../types.ts";
import { api } from "../lib/api.ts";
import InteractiveMap from "./InteractiveMap.tsx";

interface AnalyticsDashboardProps {
  issues: CivicIssue[];
  onSelectIssue: (issue: CivicIssue) => void;
}

export default function AnalyticsDashboard({ issues, onSelectIssue }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.getAnalytics();
        setAnalytics(res.analytics);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading || !analytics) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-2">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono">Aggregating Municipal Civic Analytics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#1E2229] border border-[#2D3139] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-[#F3F4F6]">Civic Accountability Intelligence & Decision Support</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Real-time municipal performance benchmarks, SLA velocity, and recurrence forecasting.
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 self-start sm:self-auto">
          Updated Live (30-Sec Ingestion)
        </span>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#1E2229] border border-[#2D3139] space-y-1 shadow-lg">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Average Resolution Time</span>
          <div className="text-3xl font-bold text-white font-mono">{analytics.averageResolutionTimeHours} hrs</div>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" /> 18% faster than last quarter
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#1E2229] border border-[#2D3139] space-y-1 shadow-lg">
          <span className="text-xs font-medium text-blue-400 uppercase tracking-widest">SLA Compliance Rate</span>
          <div className="text-3xl font-bold text-blue-400 font-mono">{analytics.slaComplianceRate}%</div>
          <p className="text-[10px] text-gray-400">Target threshold: &gt; 90%</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#1E2229] border border-[#2D3139] space-y-1 shadow-lg">
          <span className="text-xs font-medium text-amber-400 uppercase tracking-widest">Citizen Satisfaction</span>
          <div className="text-3xl font-bold text-amber-400 font-mono">{analytics.citizenSatisfactionRating} / 5.0</div>
          <p className="text-[10px] text-gray-400">Based on verified sign-offs</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#1E2229] border border-[#2D3139] space-y-1 shadow-lg">
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-widest">Total Resolved Volume</span>
          <div className="text-3xl font-bold text-emerald-400 font-mono">{analytics.resolvedCount}</div>
          <p className="text-[10px] text-gray-400">Out of {analytics.totalIssues} registered</p>
        </div>
      </div>

      {/* Grid: SLA Leaderboard & Recurring Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Department SLA Leaderboard */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#1E2229] border border-[#2D3139] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-[#F3F4F6] flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Department SLA Accountability Leaderboard
              </h3>
              <p className="text-xs text-gray-400">
                Ranked by SLA compliance percentage and citizen satisfaction ratings
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {analytics.departmentLeaderboard.map((dept, idx) => (
              <div
                key={dept.departmentName}
                className="p-4 rounded-xl bg-[#0F1115] border border-[#2D3139] space-y-2 hover:border-gray-600 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black font-mono ${
                        idx === 0
                          ? "bg-amber-500 text-slate-950"
                          : idx === 1
                          ? "bg-gray-300 text-slate-950"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : "bg-[#1E2229] text-gray-400 border border-[#2D3139]"
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{dept.departmentName}</h4>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {dept.totalAssigned} assigned • {dept.resolvedCount} resolved • Avg {dept.averageResolutionHours}h fix
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-blue-400 font-mono">{dept.slaCompliancePercent}%</span>
                    <div className="text-[10px] text-amber-400">★ {dept.citizenSatisfaction} / 5.0</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-[#1E2229] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${dept.slaCompliancePercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: High-Incident Recurring Problem Spots */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              High-Incident Hotspots
            </h3>
            <p className="text-xs text-slate-400">Recurring infrastructure failure corridors</p>
          </div>

          <div className="space-y-3">
            {analytics.recurringHotspots.map((spot) => (
              <div
                key={spot.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-rose-900/30 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300 truncate max-w-[170px]">{spot.neighborhood}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    {spot.recurrenceCount} Incidents
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Primary: {spot.primaryCategory}</p>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  Lat {spot.latitude.toFixed(3)}, Lng {spot.longitude.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* City-wide Heatmap and Volume Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Map Density */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Geographic Density & Incident Concentration
          </h3>
          <div className="h-72 rounded-xl overflow-hidden border border-slate-800 shadow-lg">
            <InteractiveMap issues={issues} onSelectIssue={onSelectIssue} />
          </div>
        </div>

        {/* Resolution Velocity Trends */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Monthly Intake vs. Resolution Velocity
          </h3>

          <div className="space-y-4 pt-2">
            {analytics.monthlyTrends.map((trend) => (
              <div key={trend.month} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">{trend.month}</span>
                  <span className="text-slate-400 font-mono">
                    <strong className="text-cyan-400">{trend.resolved}</strong> resolved /{" "}
                    <strong className="text-white">{trend.reported}</strong> reported
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(trend.resolved / trend.reported) * 100}%` }}
                  />
                  <div
                    className="h-full bg-slate-700 rounded-full"
                    style={{ width: `${100 - (trend.resolved / trend.reported) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
