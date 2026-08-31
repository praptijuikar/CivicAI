import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpDown,
  MapPin,
  X,
  ExternalLink,
} from "lucide-react";
import type { CivicIssue, User, Language, IssueStatus } from "../types";
import { VoiceField } from "./VoiceControls";
import { api } from "../lib/api";
import { deduplicateComplaints } from "../lib/deduplication";
import { Network, Sparkles, Loader2 } from "lucide-react";

interface AuthorityDashboardProps {
  issues: CivicIssue[];
  currentUser: User;
  onUpdateStatus: (
    issueId: string,
    status: IssueStatus,
    comment?: string,
    assignedDepartment?: string,
    slaHours?: number
  ) => void;
  onSelectIssue: (issue: CivicIssue) => void;
  language: Language;
  onRefreshIssues?: () => Promise<void>;
}

export default function AuthorityDashboard({
  issues,
  onUpdateStatus,
  onSelectIssue,
}: AuthorityDashboardProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"severity" | "date" | "upvotes">("date");
  const [selectedIssueForAction, setSelectedIssueForAction] = useState<CivicIssue | null>(null);
  const [actionComment, setActionComment] = useState("");
  const [assignedDept, setAssignedDept] = useState("");
  const [customSla] = useState<number>(24);
  const [budgetCap, setBudgetCap] = useState("50000");
  const [crisisMode, setCrisisMode] = useState(false);
  const [allocation, setAllocation] = useState<Awaited<ReturnType<typeof api.allocateBudget>>["allocation"] | null>(null);
  const [isAllocating, setIsAllocating] = useState(false);
  const [localComplaints, setLocalComplaints] = useState<CivicIssue[]>([]);

  useEffect(() => {
    const loadLocal = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("civic_complaints") || "[]");
        const mapped = stored.map((loc: any): CivicIssue => ({
          id: loc.id,
          title: `${loc.category} - ${loc.subtype}`,
          description: loc.description,
          category: loc.category,
          subcategory: loc.subtype,
          severity: "Medium",
          status: "submitted",
          createdAt: loc.timestamp,
          locationAddress: loc.location,
          address: loc.location,
          latitude: loc.coordinates?.lat || 0,
          longitude: loc.coordinates?.lng || 0,
          initialImageUrl: loc.photoUrl,
          upvotesCount: 0,
          upvotes: 0,
          reportCount: 1,
          aiUrgencyScore: 50,
          priorityScore: 50,
          userId: "anonymous",
          reporterName: "Anonymous Citizen",
          assignedDepartment: "Pending Assignment",
          aiAnalysis: {
            isValidScene: true,
            hasVisibleIssue: true,
            primaryIssueDetected: loc.subtype,
            isCategoryMismatch: false,
            isAuthentic: true,
            authenticityReasoning: "Citizen submitted",
            predictedCategory: loc.category,
            subcategory: loc.subtype,
            confidence: 90,
            severity: "Medium",
            calculatedPriorityScore: 50,
            safetyRisks: [],
            recommendedDepartment: "General",
            estimatedResolutionHours: 24,
            suggestedEquipment: [],
            actionChecklist: [],
            summary: loc.description,
            verificationStatus: "verified",
            sceneRelevance: "uncertain"
          },
          history: [],
          updatedAt: loc.timestamp
        }));
        setLocalComplaints(mapped);
      } catch(e) {}
    };
    loadLocal();

    const handleStorage = () => loadLocal();
    window.addEventListener("new_complaint_added", handleStorage);
    window.addEventListener("storage", (e) => {
      if (e.key === "civic_complaints") handleStorage();
    });

    return () => {
      window.removeEventListener("new_complaint_added", handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const combinedIssues = [...localComplaints, ...(issues || [])];
  const uniqueIssues = Array.from(new Map(combinedIssues.map(item => [item.id, item])).values());
  const safeIssues = uniqueIssues;

  // Auto-deduplicate on client-side
  const displayIssues = React.useMemo(() => {
    return deduplicateComplaints(safeIssues);
  }, [safeIssues]);

  // Filter & Sort Logic
  const filteredIssues = displayIssues
    .filter((issue) => issue.status !== "duplicate_resolved")
    .filter((issue) => {
      const matchesSearch =
        issue?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (issue?.locationAddress &&
          issue.locationAddress.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus =
        selectedStatus === "ALL" || issue.status === selectedStatus;
      const matchesCategory =
        selectedCategory === "ALL" || issue.category === selectedCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "severity") {
        const severityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return severityWeight[b.severity] - severityWeight[a.severity];
      }
      if (sortBy === "upvotes") return (b.upvotesCount || 0) - (a.upvotesCount || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleStatusChange = (newStatus: IssueStatus) => {
    if (!selectedIssueForAction) return;
    onUpdateStatus(
      selectedIssueForAction.id,
      newStatus,
      actionComment,
      assignedDept || selectedIssueForAction.assignedDepartment,
      customSla
    );
    setSelectedIssueForAction(null);
    setActionComment("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-surface border border-border-subtle rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-foreground/60 font-medium">{t('Total Assigned')}</p>
            <p className="text-2xl font-bold text-foreground font-mono mt-1">
              {safeIssues.length}
            </p>
          </div>
          <ShieldAlert className="w-8 h-8 text-ashoka-navy dark:text-ashoka-navy opacity-80" />
        </div>

        <div className="p-4 bg-surface border border-border-subtle rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-foreground/60 font-medium">{t('In Progress')}</p>
            <p className="text-2xl font-bold text-amber-400 font-mono mt-1">
              {safeIssues.filter((i) => i?.status === "in_progress").length}
            </p>
          </div>
          <Clock className="w-8 h-8 text-amber-400 opacity-80" />
        </div>

        <div className="p-4 bg-surface border border-border-subtle rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-foreground/60 font-medium">{t('Critical Urgency')}</p>
            <p className="text-2xl font-bold text-rose-400 font-mono mt-1">
              {safeIssues.filter((i) => i?.severity === "Critical").length}
            </p>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-400 opacity-80" />
        </div>

        <div className="p-4 bg-surface border border-border-subtle rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-foreground/60 font-medium">{t('Resolved')}</p>
            <p className="text-2xl font-bold text-india-green font-mono mt-1">
              {issues.filter((i) => i.status === "resolved").length}
            </p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-india-green opacity-80" />
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-4 bg-surface border border-border-subtle rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-foreground/60 absolute left-3 top-3" />
          <VoiceField
            inputType="input"
            placeholder="Search tickets, addresses..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border-subtle rounded-xl text-xs text-foreground placeholder-gray-500 focus:outline-none focus:border-saffron"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-foreground/60">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-background border border-border-subtle text-foreground rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="in-progress">{t('In Progress')}</option>
              <option value="resolved">{t('Resolved')}</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-foreground/60">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-background border border-border-subtle text-foreground rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="severity">Severity</option>
              <option value="date">Newest First</option>
              <option value="upvotes">Upvotes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <section className="rounded-2xl border border-amber-500/25 bg-surface p-4 shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Budget Allocation Optimizer</h3>
            <p className="mt-1 text-xs text-foreground/60">Select the highest-impact complaint combination within the available budget.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-[10px] font-bold uppercase text-foreground/60">Budget cap
              <input value={budgetCap} onChange={(event) => setBudgetCap(event.target.value)} type="number" min="1" className="mt-1 block w-32 rounded-lg border border-border-subtle bg-background px-2.5 py-2 text-xs text-foreground outline-none focus:border-amber-400" />
            </label>
            <label className="flex items-center gap-2 pb-2 text-xs text-foreground/80">
              <input checked={crisisMode} onChange={(event) => setCrisisMode(event.target.checked)} type="checkbox" className="accent-amber-500" />
              Crisis weighting
            </label>
            <button disabled={isAllocating} onClick={async () => {
              setIsAllocating(true);
              try {
                const result = await api.allocateBudget({ budgetCap: Number(budgetCap), crisisMode });
                setAllocation(result.allocation);
              } finally {
                setIsAllocating(false);
              }
            }} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-wait">
              {isAllocating ? "Calculating..." : "Optimize budget"}
            </button>
          </div>
        </div>
        {allocation && <div className="mt-4 space-y-3 border-t border-border-subtle pt-3">
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Metric label="Selected" value={`${allocation.audit.selectedCount}`} />
            <Metric label="Deferred" value={`${allocation.audit.deferredCount}`} />
            <Metric label="Allocated" value={`$${allocation.allocatedCost.toLocaleString()}`} />
            <Metric label="Impact" value={`${allocation.totalImpact}`} />
          </div>
          <p className="text-[10px] text-foreground/60">{allocation.audit.formula}. Generated {new Date(allocation.audit.generatedAt).toLocaleString()}.</p>
          <div className="grid gap-2 md:grid-cols-2">
            <AllocationList title="Funded complaints" items={allocation.selected.map((item) => ({ id: item.issueId, text: `$${item.estimatedCost.toLocaleString()} • ${item.reason}` }))} tone="emerald" />
            <AllocationList title="Deferred with reason" items={allocation.deferred.map((item) => ({ id: item.issueId, text: `$${item.estimatedCost.toLocaleString()} • ${item.reason}` }))} tone="amber" />
          </div>
        </div>}
      </section>

      {/* Issues Table */}
      <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground/80">
            <thead className="bg-background text-foreground/60 uppercase text-[10px] tracking-wider border-b border-border-subtle">
              <tr>
                <th className="p-4">Report ID</th>
                <th className="p-4">Issue Details</th>
                <th className="p-4">{t('Category')}</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4">Submitted</th>
                <th className="p-4">Image</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3139]">
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 align-top font-mono font-bold text-ashoka-navy dark:text-ashoka-navy">{issue.id}</td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <p
                        className="font-bold text-foreground text-sm hover:text-ashoka-navy dark:text-ashoka-navy cursor-pointer flex items-center gap-2"
                        onClick={() => onSelectIssue(issue)}
                      >
                        {issue.title}
                        <ExternalLink className="w-3 h-3 text-gray-500" />
                      </p>
                      <p className="text-foreground/60 line-clamp-1">{issue.description}</p>
                      {issue.locationAddress && (
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                          <MapPin className="w-3 h-3 text-ashoka-navy dark:text-ashoka-navy" />
                          {issue.locationAddress}
                        </div>
                      )}
                      {issue.duplicateIds && issue.duplicateIds.length > 0 && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold rounded-md">
                          <Network className="w-3 h-3" />
                          [{(issue.duplicateIds.length + 1)} Reports Merged]
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-mono font-semibold text-foreground/80">
                    {issue.category}
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-foreground/60">{issue.address || issue.locationAddress}</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-background text-foreground/80 border border-border-subtle">
                      {issue.status}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap text-xs text-foreground/60">
                    {new Date(issue.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    {issue.initialImageUrl ? (
                      <img src={issue.initialImageUrl} alt="Uploaded report" className="h-12 w-16 rounded-lg border border-[#A8D7D5] object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500">None</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedIssueForAction(issue);
                        setAssignedDept(issue.assignedDepartment || "");
                      }}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-saffron/90/20 text-ashoka-navy dark:text-ashoka-navy border border-saffron/30 rounded-lg text-xs font-semibold transition"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {selectedIssueForAction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-base font-bold text-foreground">
                Dispatch & Status Update
              </h3>
              <button
                onClick={() => setSelectedIssueForAction(null)}
                className="text-foreground/60 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-foreground/60 font-medium block mb-1">
                  Department Assignment
                </label>
                <input
                  type="text"
                  value={assignedDept}
                  onChange={(e) => setAssignedDept(e.target.value)}
                  placeholder="e.g. Public Works, Electrical Maintenance"
                  className="w-full px-3 py-2 bg-background border border-border-subtle rounded-xl text-xs text-foreground focus:outline-none focus:border-saffron"
                />
              </div>

              <div>
                <label className="text-xs text-foreground/60 font-medium block mb-1">
                  Official Status Comment
                </label>
                <textarea
                  rows={3}
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder="Provide resolution details or dispatch instructions..."
                  className="w-full px-3 py-2 bg-background border border-border-subtle rounded-xl text-xs text-foreground focus:outline-none focus:border-saffron"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleStatusChange("in_progress")}
                  className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs hover:bg-amber-500/30 transition"
                >
                  Set to In Progress
                </button>
                <button
                  onClick={() => handleStatusChange("resolved")}
                  className="px-4 py-2 bg-india-green/20 text-india-green border border-emerald-500/30 rounded-xl font-bold text-xs hover:bg-india-green/30 transition"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border-subtle bg-background p-2"><span className="block text-[10px] text-gray-500">{label}</span><strong className="font-mono text-foreground">{value}</strong></div>;
}

function AllocationList({ title, items, tone }: { title: string; items: { id: string; text: string }[]; tone: "emerald" | "amber" }) {
  return <div className="rounded-lg border border-border-subtle bg-background p-3"><h4 className={`text-xs font-bold ${tone === "emerald" ? "text-emerald-300" : "text-amber-300"}`}>{title}</h4><div className="mt-2 max-h-32 space-y-1 overflow-y-auto">{items.length === 0 ? <p className="text-[10px] text-gray-500">None</p> : items.map((item) => <p key={item.id} className="text-[10px] text-foreground/80"><span className="font-mono text-cyan-300">{item.id}</span> {item.text}</p>)}</div></div>;
}