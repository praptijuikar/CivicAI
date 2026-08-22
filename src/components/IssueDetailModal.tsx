import { useState } from "react";
import {
  X,
  MapPin,
  Clock,
  ShieldAlert,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
  ThumbsUp,
  Share2,
  Calendar,
  Layers,
  Wrench,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import type { CivicIssue, User as UserType } from "../types.ts";
import { api } from "../lib/api.ts";

interface IssueDetailModalProps {
  issue: CivicIssue;
  currentUser: UserType;
  onClose: () => void;
  onIssueUpdated: (updated: CivicIssue) => void;
}

export default function IssueDetailModal({
  issue,
  currentUser,
  onClose,
  onIssueUpdated,
}: IssueDetailModalProps) {
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
          colors: ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"],
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
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  const getStatusBadge = () => {
    switch (issue.status) {
      case "verified":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "resolved":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case "in_progress":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      case "assigned":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/60">
                {issue.id}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getSeverityBadge()}`}>
                {issue.severity} Severity
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${getStatusBadge()}`}>
                {issue.status.replace("_", " ")}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Priority: <strong className="text-white">{issue.priorityScore}</strong>/100
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">{issue.title}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{issue.address}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === "overview"
                ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Overview & Photos
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "ai"
                ? "border-indigo-400 text-indigo-400 bg-indigo-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            AI Vision Triage
          </button>
          <button
            onClick={() => setActiveTab("resolution")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "resolution"
                ? "border-emerald-400 text-emerald-400 bg-emerald-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Resolution & Verify
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "history"
                ? "border-blue-400 text-blue-400 bg-blue-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
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
              {/* Image Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issue.initialImageUrl && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Initial Report Photo
                    </span>
                    <div className="relative rounded-xl overflow-hidden border border-slate-800 h-52 bg-slate-950">
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
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Officer After-Repair Photo
                    </span>
                    <div className="relative rounded-xl overflow-hidden border border-emerald-900/60 h-52 bg-slate-950">
                      <img
                        src={issue.afterImageUrl}
                        alt="Resolved repair"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description & Metadata Card */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Issue Description & Scope
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">{issue.description}</p>
                {issue.landmark && (
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-300">Landmark reference:</strong> {issue.landmark}
                  </p>
                )}
              </div>

              {/* Key Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Category</span>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">{issue.category}</p>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Department</span>
                  <p className="text-xs font-semibold text-cyan-400 mt-0.5 truncate">
                    {issue.assignedDepartment || "Pending Routing"}
                  </p>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Assigned Officer</span>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">
                    {issue.assignedOfficerName || "Unassigned"}
                  </p>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Report Count / Upvotes</span>
                  <p className="text-xs font-semibold text-amber-400 mt-0.5 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    {issue.reportCount} reports • {issue.upvotes} upvotes
                  </p>
                </div>
              </div>

              {/* Community Actions */}
              <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">
                  Are you experiencing this same defect in your neighborhood?
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyShareLink}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {copiedLink ? "Link Copied!" : "Share"}
                  </button>
                  <button
                    onClick={handleUpvote}
                    disabled={isUpvoting || hasUpvoted}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
                      hasUpvoted
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
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Gemini 3.7 Flash Neural Assessment</h4>
                      <p className="text-[11px] text-indigo-300">
                        Confidence Score: <strong>{(issue.aiAnalysis?.confidence ? issue.aiAnalysis.confidence * 100 : 96).toFixed(0)}%</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 bg-indigo-900/60 text-indigo-200 rounded-lg border border-indigo-700">
                    CV Pipeline v2.4
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-indigo-900/40">
                  {issue.aiAnalysis?.summary ||
                    "Visual inspection identified municipal defect requiring dispatch. Structural integrity rating computed."}
                </p>

                {/* Safety Risks */}
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

                {/* Recommended First Responder Checklist */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    Automated Field Responder Checklist:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    {(issue.aiAnalysis?.actionChecklist || [
                      "Establish safety perimeter & high-vis signage",
                      "Inspect extent of sub-base defect",
                      "Perform standard certified municipal patch",
                    ]).map((step, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
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
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Officer Resolution Log
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleString() : "Recently resolved"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      {issue.resolutionNotes || "Work completed according to municipal standards. Ready for inspection."}
                    </p>
                    {issue.materialsUsed && issue.materialsUsed.length > 0 && (
                      <div className="text-xs text-slate-400">
                        <strong className="text-slate-300">Materials Applied:</strong> {issue.materialsUsed.join(", ")}
                      </div>
                    )}
                  </div>

                  {/* Citizen Verification Action Box */}
                  {issue.status === "resolved" && (
                    <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-700/50 space-y-4">
                      <div className="flex items-center gap-2 text-indigo-300">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        <h4 className="text-sm font-bold text-white">Citizen Verification Required</h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        The municipal department has declared this issue repaired. Please inspect the after-photo and confirm if you are satisfied with the repair.
                      </p>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">
                          Verification Comments (Optional):
                        </label>
                        <input
                          type="text"
                          value={verificationFeedback}
                          onChange={(e) => setVerificationFeedback(e.target.value)}
                          placeholder="e.g. Excellent work! Completely smooth now."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleCitizenVerification(true)}
                          disabled={isSubmittingVerification}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg transition"
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
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
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
                <div className="p-6 text-center rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <Clock className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
                  <h4 className="text-sm font-bold text-slate-200">Work Currently in Progress</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
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
              <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
                {issue.history.map((h, i) => (
                  <div key={h.id || i} className="relative group">
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-cyan-500 border-4 border-slate-900" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{h.action}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                          {new Date(h.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{h.details}</p>
                      <span className="inline-block text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>
            Reported by <strong className="text-slate-200">{issue.reporterName}</strong> on{" "}
            {new Date(issue.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
