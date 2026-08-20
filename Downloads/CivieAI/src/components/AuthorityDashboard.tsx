import { useState, useEffect, type MouseEvent } from "react";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Search,
  Filter,
  Layers,
  ArrowUpDown,
  Send,
  Sparkles,
  MapPin,
  Flame,
  Wrench,
  Users,
  Calendar,
  X,
} from "lucide-react";
import type { CivicIssue, User, DepartmentStats } from "../types.ts";
import { api } from "../lib/api.ts";
import InteractiveMap from "./InteractiveMap.tsx";

interface AuthorityDashboardProps {
  currentUser: User;
  issues: CivicIssue[];
  onSelectIssue: (issue: CivicIssue) => void;
  onRefreshIssues: () => void;
}

export default function AuthorityDashboard({
  currentUser,
  issues,
  onSelectIssue,
  onRefreshIssues,
}: AuthorityDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedIssueForDispatch, setSelectedIssueForDispatch] = useState<CivicIssue | null>(null);

  // Officers list and departments
  const [officers, setOfficers] = useState<User[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("Department of Transportation");
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [slaHours, setSlaHours] = useState(8);
  const [adminNotes, setAdminNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const loadOfficers = async () => {
      try {
        const res = await api.getOfficers();
        setOfficers(res.officers || []);
        if (res.officers?.length) {
          setSelectedOfficerId(res.officers[0].id);
        }
      } catch (err) {
        console.error("Failed to load officers:", err);
      }
    };
    loadOfficers();
  }, []);

  // Compute KPI metrics
  const totalCount = issues.length;
  const pendingDispatchCount = issues.filter((i) => i.status === "submitted").length;
  const inProgressCount = issues.filter((i) => i.status === "in_progress" || i.status === "assigned").length;
  const resolvedCount = issues.filter((i) => i.status === "resolved" || i.status === "verified").length;
  const criticalCount = issues.filter((i) => i.severity === "Critical" && i.status !== "verified").length;

  // Filter & Sort Issues by Priority Score
  const filteredIssues = issues
    .filter((issue) => {
      const matchSearch =
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || issue.status === statusFilter;
      const matchCategory = categoryFilter === "all" || issue.category === categoryFilter;
      const matchSeverity = severityFilter === "all" || issue.severity === severityFilter;
      return matchSearch && matchStatus && matchCategory && matchSeverity;
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const handleOpenDispatchModal = (issue: CivicIssue, e: MouseEvent) => {
    e.stopPropagation();
    setSelectedIssueForDispatch(issue);
    setSelectedDepartment(issue.assignedDepartment || "Department of Transportation");
    setSlaHours(issue.slaHours || 8);
    setAdminNotes(`High priority dispatch via CivicAI Admin Console.`);
  };

  const handleExecuteDispatch = async () => {
    if (!selectedIssueForDispatch) return;
    setIsAssigning(true);

    const officer = officers.find((o) => o.id === selectedOfficerId);
    const deadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    try {
      await api.assignIssue(selectedIssueForDispatch.id, {
        department: selectedDepartment,
        officerId: officer?.id,
        officerName: officer?.name,
        slaHours: slaHours,
        deadlineAt: deadline,
        adminNotes: adminNotes,
      });

      setSelectedIssueForDispatch(null);
      onRefreshIssues();
    } catch (err) {
      console.error("Failed to assign dispatch:", err);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#1E2229] border border-[#2D3139] shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
            <h2 className="text-lg font-bold text-[#F3F4F6]">Authority Municipal Operations Console</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Real-Time Automated Triage, Intelligent Dispatch & SLA Enforcement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 font-bold">
            Active Administrator: {currentUser.name}
          </span>
        </div>
      </div>

      {/* Geometric Balance KPI Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#1E2229] border border-[#2D3139] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Total Workload</span>
          <div className="flex items-end justify-between mt-3">
            <span className="text-3xl font-bold font-mono text-white">{totalCount}</span>
            <span className="text-xs text-emerald-400 font-medium">+12% vs last mo</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#1E2229] border border-[#2D3139] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <span className="text-xs text-amber-400 font-medium uppercase tracking-widest flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pending Dispatch
          </span>
          <div className="flex items-end justify-between mt-3">
            <span className="text-3xl font-bold font-mono text-amber-300">{pendingDispatchCount}</span>
            <span className="text-[10px] text-amber-400/90 font-medium">Needs routing</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#1E2229] border border-[#2D3139] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <span className="text-xs text-blue-400 font-medium uppercase tracking-widest flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5" />
            In Active Work
          </span>
          <div className="flex items-end justify-between mt-3">
            <span className="text-3xl font-bold font-mono text-blue-300">{inProgressCount}</span>
            <span className="text-[10px] text-blue-400/90 font-medium">Field crews on-site</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#1E2229] border border-[#2D3139] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <span className="text-xs text-emerald-400 font-medium uppercase tracking-widest flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolved / Verified
          </span>
          <div className="flex items-end justify-between mt-3">
            <span className="text-3xl font-bold font-mono text-emerald-300">{resolvedCount}</span>
            <span className="text-[10px] text-emerald-400 font-mono">89.2% rate</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-[#1E2229] border border-[#2D3139] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1.5 bg-red-500/10 text-red-500 text-[9px] font-bold px-2 rounded-bl-lg">CRITICAL</div>
          <span className="text-xs text-red-400 font-medium uppercase tracking-widest flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            Active Alerts
          </span>
          <div className="flex items-end justify-between mt-3">
            <span className="text-3xl font-bold font-mono text-red-400">{criticalCount}</span>
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-red-500 rounded-full"></div>
              <div className="w-1 h-3 bg-red-500/40 rounded-full"></div>
              <div className="w-1 h-2 bg-red-500/20 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map with Severity Overlays */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F3F4F6] flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Municipal GIS Defect Heat & Severity Map
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Critical Infrastructure</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Safety Violations</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> General Utility</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Resolved</span>
          </div>
        </div>

        <div className="h-96 rounded-3xl overflow-hidden border border-[#2D3139] shadow-2xl bg-[#151921]">
          <InteractiveMap issues={filteredIssues} onSelectIssue={onSelectIssue} />
        </div>
      </div>

      {/* Issues Queue Table with Search & Advanced Filter Controls */}
      <div className="p-6 rounded-3xl bg-[#1E2229] border border-[#2D3139] shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-[#F3F4F6]">Central Operations Queue</h3>
            <p className="text-xs text-gray-400">
              Sorted by Priority Urgency Score (0 - 100) • Showing {filteredIssues.length} tickets
            </p>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ID, title, street..."
              className="w-full bg-[#0F1115] border border-[#2D3139] rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#F3F4F6] focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Filter Badges Bar */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#2D3139]/80">
          <span className="text-xs text-gray-400 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0F1115] border border-[#2D3139] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted (Pending)</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="verified">Citizen Verified</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0F1115] border border-[#2D3139] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="Roads & Infrastructure">Roads & Infrastructure</option>
            <option value="Water & Sewage">Water & Sewage</option>
            <option value="Electrical & Lighting">Electrical & Lighting</option>
            <option value="Sanitation & Waste">Sanitation & Waste</option>
            <option value="Parks & Public Spaces">Parks & Public Spaces</option>
            <option value="Public Safety & Encroachment">Public Safety & Encroachment</option>
          </select>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0F1115] border border-[#2D3139] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {(searchTerm || statusFilter !== "all" || categoryFilter !== "all" || severityFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCategoryFilter("all");
                setSeverityFilter("all");
              }}
              className="text-xs text-blue-400 hover:underline px-2"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-[#2D3139]">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0F1115] text-gray-400 uppercase tracking-widest text-[10px] font-bold border-b border-[#2D3139]">
              <tr>
                <th className="py-3 px-4">Priority & ID</th>
                <th className="py-3 px-4">Issue Description</th>
                <th className="py-3 px-4">Category / Dept</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Crew</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3139]/80 bg-[#151921]/50">
              {filteredIssues.map((issue) => (
                <tr
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  className="hover:bg-[#1E2229] transition cursor-pointer group"
                >
                  {/* Priority & ID */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono shadow-sm ${
                          issue.priorityScore >= 80
                            ? "bg-red-600 text-white"
                            : issue.priorityScore >= 60
                            ? "bg-orange-500 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {issue.priorityScore}
                      </span>
                      <div>
                        <div className="font-mono text-blue-400 font-bold">{issue.id}</div>
                        <div className="text-[10px] text-gray-400">{issue.severity}</div>
                      </div>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-bold text-[#F3F4F6] line-clamp-1">{issue.title}</div>
                    <div className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                      {issue.address}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-200">{issue.category}</div>
                    <div className="text-[10px] text-blue-400 truncate max-w-[150px]">
                      {issue.assignedDepartment || "Unassigned"}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        issue.status === "verified"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : issue.status === "resolved"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          : issue.status === "in_progress"
                          ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                          : issue.status === "assigned"
                          ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                          : "bg-gray-800 text-gray-300 border-gray-700"
                      }`}
                    >
                      {issue.status.replace("_", " ")}
                    </span>
                  </td>

                  {/* Assigned Officer */}
                  <td className="py-3.5 px-4">
                    {issue.assignedOfficerName ? (
                      <div className="flex items-center gap-1.5 text-gray-200">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="truncate max-w-[120px]">{issue.assignedOfficerName}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-500 italic">None assigned</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => handleOpenDispatchModal(issue, e)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                      >
                        <Send className="w-3 h-3" />
                        Dispatch
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SMART ROUTING & SLA ASSIGNMENT MODAL */}
      {selectedIssueForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            className="w-full max-w-xl bg-[#1E2229] border border-[#2D3139] rounded-2xl shadow-2xl overflow-hidden text-[#F3F4F6] animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-[#2D3139] flex items-start justify-between bg-[#151921]">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {selectedIssueForDispatch.id}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Intelligent Dispatch & SLA Assignment
                </h3>
                <p className="text-xs text-gray-400">{selectedIssueForDispatch.title}</p>
              </div>
              <button
                onClick={() => setSelectedIssueForDispatch(null)}
                className="p-2 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* AI Recommendation Banner */}
              <div className="p-3.5 rounded-xl bg-[#0F1115] border border-blue-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">AI Routing Recommendation</div>
                  <p className="text-xs text-gray-300">
                    Based on defect visual category (<strong>{selectedIssueForDispatch.category}</strong>), routing to <strong>Department of Transportation</strong> with <strong>8-hour SLA deadline</strong> is recommended.
                  </p>
                </div>
              </div>

              {/* Department Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">Responsible Municipal Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full bg-[#0F1115] border border-[#2D3139] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Department of Transportation">Department of Transportation (Streets & Signals)</option>
                  <option value="Public Utilities Commission (Water/Sewage)">Public Utilities Commission (Water/Sewage)</option>
                  <option value="Bureau of Sanitation & Waste">Bureau of Sanitation & Waste</option>
                  <option value="Recreation and Parks Department">Recreation and Parks Department</option>
                  <option value="Department of Building Inspection & Zoning">Department of Building Inspection & Zoning</option>
                </select>
              </div>

              {/* Field Officer Workload Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">Assign Field Officer / Crew Lead</label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full bg-[#0F1115] border border-[#2D3139] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {officers.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name} ({officer.department}) • Currently Assigned: {officer.activeTasksCount || 2} tasks
                    </option>
                  ))}
                </select>
              </div>

              {/* SLA Target Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">SLA Resolution Window</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { hours: 4, label: "4 Hours (Critical)" },
                    { hours: 8, label: "8 Hours (High)" },
                    { hours: 24, label: "24 Hours (Standard)" },
                    { hours: 48, label: "48 Hours (Low)" },
                  ].map((sla) => (
                    <button
                      key={sla.hours}
                      type="button"
                      onClick={() => setSlaHours(sla.hours)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition border ${
                        slaHours === sla.hours
                          ? "bg-blue-600 text-white border-blue-400 shadow-md"
                          : "bg-[#0F1115] text-gray-400 border-[#2D3139] hover:border-gray-600"
                      }`}
                    >
                      {sla.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Dispatch Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">Special Dispatch Instructions</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full bg-[#0F1115] border border-[#2D3139] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#2D3139] bg-[#151921] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedIssueForDispatch(null)}
                className="px-4 py-2 bg-[#1E2229] hover:bg-[#252a33] text-gray-300 text-xs font-semibold rounded-xl border border-[#2D3139]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDispatch}
                disabled={isAssigning}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isAssigning ? "Issuing Work Order..." : "Confirm & Dispatch Work Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
