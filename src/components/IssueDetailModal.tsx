import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  X,
  MapPin,
  Clock,
  ShieldAlert,
  Bot,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ThumbsUp,
  Share2,
  Wrench,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import type { CivicIssue, User as UserType, Language } from "../types";
import { api } from "../lib/api";

interface IssueDetailModalProps {
  issue: CivicIssue;
  currentUser: UserType;
  onClose: () => void;
  onIssueUpdated: (updated: CivicIssue) => void;
  language: Language;
}

export default function IssueDetailModal({
  issue,
  currentUser,
  onClose,
  onIssueUpdated,
}: IssueDetailModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"overview" | "ai" | "history" | "resolution">("overview");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState("");
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const hasUpvoted = issue.upvotedUserIds?.includes(currentUser.id);

  const handleUpvote = async () => {
    if (isUpvoting || hasUpvoted) return;
    setIsUpvoting(true);
    try {
      const res = await api.upvoteIssue(issue.id, currentUser.id);
      onIssueUpdated(res.issue);
    } catch (err) {
      console.error("Upvote failed:", err);
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleCitizenVerification = async (isSatisfied: boolean) => {
    setIsSubmittingVerification(true);
    try {
      const res = await api.verifyIssue(issue.id, {
        isSatisfied,
        verificationNotes: verificationFeedback,
        citizenName: currentUser.name,
      });

      if (isSatisfied) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#7DD6D2", "#3B4948", "#EC8C6F", "#A8D7D5"],
        });
      }

      onIssueUpdated(res.issue);
      setIsVerifying(false);
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getSeverityBadge = () => {
    switch (issue.severity) {
      case "Critical":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse";
      case "High":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "Medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      default:
        return "bg-india-green/20 text-emerald-300 border-emerald-500/40";
    }
  };

  const getStatusBadge = () => {
    switch (issue.status) {
      case "verified":
        return "bg-india-green/20 text-emerald-300 border-emerald-500/40";
      case "resolved":
        return "bg-cyan-500/20 text-cyan-300 border-saffron/40";
      case "in_progress":
        return "bg-ashoka-navy/100/20 text-indigo-300 border-indigo-500/40";
      case "assigned":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      default:
        return "bg-slate-700 text-foreground/80 border-slate-600";
    }
  };

  return (
    <div data-localize-root="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-xl overflow-y-auto">
      <div
        className="relative w-full max-w-3xl glass-panel rounded-2xl shadow-2xl overflow-hidden my-8 text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border-subtle bg-surface/90 sticky top-0 z-20 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-ashoka-navy dark:text-ashoka-navy bg-cyan-950/50 px-2 py-0.5 rounded border border-saffron/60">
                {issue.id}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getSeverityBadge()}`}>
                {issue.severity} Severity
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${getStatusBadge()}`}>
                {issue.status.replace("_", " ")}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">{issue.title}</h2>
            <p className="text-xs text-foreground/60 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{issue.address}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-foreground/60 hover:text-foreground hover:bg-background rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border-subtle bg-background/50 px-5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${activeTab === "overview"
                ? "border-saffron text-ashoka-navy dark:text-ashoka-navy bg-cyan-950/20"
                : "border-transparent text-foreground/60 hover:text-foreground/80"
              }`}
          >
            Overview & Photos
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${activeTab === "ai"
                ? "border-indigo-400 text-indigo-400 bg-indigo-950/20"
                : "border-transparent text-foreground/60 hover:text-foreground/80"
              }`}
          >
            <Bot className="w-3.5 h-3.5" />
            AI Vision Triage
          </button>
          <button
            onClick={() => setActiveTab("resolution")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${activeTab === "resolution"
                ? "border-emerald-400 text-india-green bg-emerald-950/20"
                : "border-transparent text-foreground/60 hover:text-foreground/80"
              }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Resolution & Verify
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${activeTab === "history"
                ? "border-blue-400 text-blue-400 bg-blue-950/20"
                : "border-transparent text-foreground/60 hover:text-foreground/80"
              }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Audit Trail ({issue.history.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issue.initialImageUrl && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">
                      Initial Report Photo
                    </span>
                    <div className="relative rounded-xl overflow-hidden border border-border-subtle h-52 bg-background">
                      <img
                        src={issue.initialImageUrl}
                        alt="Initial defect"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                {issue.afterImageUrl && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-india-green uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Officer After-Repair Photo
                    </span>
                    <div className="relative rounded-xl overflow-hidden border border-emerald-900/60 h-52 bg-background">
                      <img
                        src={issue.afterImageUrl}
                        alt="Resolved repair"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-background/60 border border-border-subtle space-y-3">
                <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  Issue Description & Scope
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{issue.description}</p>
                {issue.landmark && (
                  <p className="text-xs text-foreground/60">
                    <strong className="text-foreground/80">Landmark reference:</strong> {issue.landmark}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-background/40 rounded-xl border border-border-subtle">
                  <span className="text-[10px] text-foreground/60 uppercase font-medium">{t('Category')}</span>
                  <p className="text-xs font-semibold text-foreground/80 mt-0.5 truncate">{issue.category}</p>
                </div>
                <div className="p-3 bg-background/40 rounded-xl border border-border-subtle">
                  <span className="text-[10px] text-foreground/60 uppercase font-medium">{t('Department')}</span>
                  <p className="text-xs font-semibold text-ashoka-navy dark:text-ashoka-navy mt-0.5 truncate">
                    {issue.assignedDepartment || "Pending Routing"}
                  </p>
                </div>
                <div className="p-3 bg-background/40 rounded-xl border border-border-subtle">
                  <span className="text-[10px] text-foreground/60 uppercase font-medium">{t('Assigned Officer')}</span>
                  <p className="text-xs font-semibold text-foreground/80 mt-0.5 truncate">
                    {issue.assignedOfficerName || "Unassigned"}
                  </p>
                </div>
                <div className="p-3 bg-background/40 rounded-xl border border-border-subtle">
                  <span className="text-[10px] text-foreground/60 uppercase font-medium">Report Count / Upvotes</span>
                  <p className="text-xs font-semibold text-amber-400 mt-0.5 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    {issue.reportCount} reports • {issue.upvotes} upvotes
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-background/60 rounded-xl border border-border-subtle">
                <div className="text-xs text-foreground/60">
                  Are you experiencing this same defect in your neighborhood?
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyShareLink}
                    className="px-3 py-1.5 rounded-lg border border-border-subtle hover:border-foreground/20 bg-background hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {copiedLink ? "Link Copied!" : "Share"}
                  </button>
                  <button
                    onClick={handleUpvote}
                    disabled={isUpvoting || hasUpvoted}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${hasUpvoted
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default"
                        : "bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold"
                      }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {hasUpvoted ? "Confirmed & Upvoted" : "+1 Confirm Issue"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI VISION TRIAGE */}
          {activeTab === "ai" && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-ashoka-navy flex items-center justify-center text-foreground">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Gemini 3.7 Flash Neural Assessment</h4>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 bg-indigo-900/60 text-indigo-200 rounded-lg border border-indigo-700">
                    CV Pipeline v2.4
                  </span>
                </div>

                <p className="text-xs text-foreground/80 leading-relaxed bg-background/60 p-3.5 rounded-xl border border-indigo-900/40">
                  {issue.aiAnalysis?.summary ||
                    "Visual inspection identified municipal defect requiring dispatch."}
                </p>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    Identified Public Safety Hazards:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(issue.aiAnalysis?.safetyRisks || [
                      "Pedestrian and two-wheeler impact risk",
                      "Sub-surface pavement degradation",
                    ]).map((risk, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-rose-950/30 text-rose-200 border border-rose-900/50 p-2.5 rounded-lg flex items-start gap-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-ashoka-navy dark:text-ashoka-navy" />
                    Automated Field Responder Checklist:
                  </span>
                  <ul className="space-y-1.5 text-xs text-foreground/80 bg-background/50 p-3 rounded-xl border border-border-subtle">
                    {(issue.aiAnalysis?.actionChecklist || [
                      "Establish safety perimeter & high-vis signage",
                      "Inspect extent of sub-base defect",
                      "Perform standard certified municipal patch",
                    ]).map((step, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-ashoka-navy dark:text-ashoka-navy shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESOLUTION & CITIZEN VERIFICATION */}
          {activeTab === "resolution" && (
            <div className="space-y-6">
              {issue.status === "resolved" || issue.status === "verified" ? (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-india-green" />
                        Officer Resolution Log
                      </span>
                      <span className="text-xs text-foreground/60 font-mono">
                        {issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleString() : "Recently resolved"}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed bg-surface/80 dark:bg-slate-100/80 dark:border-white/10 p-3 rounded-lg border border-border-subtle">
                      {issue.resolutionNotes || "Work completed according to municipal standards. Ready for inspection."}
                    </p>
                    {issue.materialsUsed && issue.materialsUsed.length > 0 && (
                      <div className="text-xs text-foreground/60">
                        <strong className="text-foreground/80">Materials Applied:</strong> {issue.materialsUsed.join(", ")}
                      </div>
                    )}
                  </div>

                  {issue.status === "resolved" && (
                    <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-700/50 space-y-4">
                      <div className="flex items-center gap-2 text-indigo-300">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        <h4 className="text-sm font-bold text-foreground">Citizen Verification Required</h4>
                      </div>
                      <p className="text-xs text-foreground/80">
                        The municipal department has declared this issue repaired. Please inspect the after-photo and confirm if you are satisfied with the repair.
                      </p>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground/80">
                          Verification Comments (Optional):
                        </label>
                        <input
                          type="text"
                          value={verificationFeedback}
                          onChange={(e) => setVerificationFeedback(e.target.value)}
                          placeholder="e.g. Excellent work! Completely smooth now."
                          className="w-full bg-surface border border-border-subtle hover:border-foreground/20 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-saffron"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleCitizenVerification(true)}
                          disabled={isSubmittingVerification}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-india-green text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Yes, Confirmed Fixed (Close Ticket)
                        </button>
                        <button
                          onClick={() => handleCitizenVerification(false)}
                          disabled={isSubmittingVerification}
                          className="flex-1 py-2.5 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          No, Defect Still Persists (Reopen)
                        </button>
                      </div>
                    </div>
                  )}

                  {issue.status === "verified" && (
                    <div className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-600/50 flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-india-green shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-200">Officially Citizen-Verified & Archived</h4>
                        <p className="text-xs text-emerald-300/80">
                          Verified by {issue.reporterName} on {issue.verifiedAt ? new Date(issue.verifiedAt).toLocaleDateString() : "recent date"}.
                          {issue.verificationNotes && ` Notes: "${issue.verificationNotes}"`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-background/40 border border-border-subtle space-y-2">
                  <Clock className="w-8 h-8 text-ashoka-navy dark:text-ashoka-navy mx-auto animate-spin" />
                  <h4 className="text-sm font-bold text-foreground/80">Work Currently in Progress</h4>
                  <p className="text-xs text-foreground/60 max-w-sm mx-auto">
                    Assigned to {issue.assignedDepartment} ({issue.assignedOfficerName || "Field Crew"}). Target resolution deadline:{" "}
                    {issue.deadlineAt ? new Date(issue.deadlineAt).toLocaleString() : "Within SLA"}.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT TRAIL */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="relative pl-6 border-l-2 border-border-subtle space-y-6">
                {issue.history.map((h, i) => (
                  <div key={h.id || i} className="relative group">
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-cyan-500 border-4 border-slate-900" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground/80">{h.action}</span>
                        <span className="text-[10px] font-mono text-foreground/60">
                          {new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                          {new Date(h.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80">{h.details}</p>
                      <span className="inline-block text-[10px] font-medium text-foreground/60 bg-background/80 px-2 py-0.5 rounded border border-border-subtle hover:border-foreground/20">
                        Actor: {h.actorName} ({h.actorRole})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-background/80 flex items-center justify-between text-xs text-foreground/60">
          <span>
            Reported by <strong className="text-foreground/80">{issue.reporterName}</strong> on{" "}
            {new Date(issue.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-background hover:bg-slate-100 text-foreground/80 font-medium transition"
          >{t('Close')}</button>
        </div>
      </div>
    </div>
  );
}