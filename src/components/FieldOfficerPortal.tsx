import { useState, useRef } from "react";
import {
  Wrench,
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  Camera,
  AlertTriangle,
  Play,
  Upload,
  Sparkles,
  ShieldAlert,
  Layers,
  ArrowRight,
  ThumbsUp,
  Flame,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import type { CivicIssue, User } from "../types.ts";
import { api } from "../lib/api.ts";

interface FieldOfficerPortalProps {
  currentUser: User;
  issues: CivicIssue[];
  onSelectIssue: (issue: CivicIssue) => void;
  onRefreshIssues: () => void;
}

export default function FieldOfficerPortal({
  currentUser,
  issues,
  onSelectIssue,
  onRefreshIssues,
}: FieldOfficerPortalProps) {
  const [activeTask, setActiveTask] = useState<CivicIssue | null>(null);
  const [executionStep, setExecutionStep] = useState<"brief" | "before_photo" | "in_progress" | "after_photo" | "completed">("brief");

  // Photos & Logs
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [materialsUsedInput, setMaterialsUsedInput] = useState("Cold mix asphalt, sealing compound, compaction roller");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);

  // Filter tasks for this officer or department
  const officerTasks = issues
    .filter((i) => i.status !== "verified")
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const handleSelectTask = (task: CivicIssue) => {
    setActiveTask(task);
    if (task.status === "in_progress") {
      setExecutionStep("in_progress");
      setBeforeImage(task.beforeImageUrl || task.initialImageUrl || null);
    } else if (task.status === "resolved") {
      setExecutionStep("completed");
      setAfterImage(task.afterImageUrl || null);
    } else {
      setExecutionStep("brief");
      setBeforeImage(task.initialImageUrl || null);
    }
  };

  const openNavigation = (task: CivicIssue) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`;
    window.open(url, "_blank");
  };

  const handleStartWork = async () => {
    if (!activeTask) return;
    setIsProcessing(true);
    try {
      await api.startWork(activeTask.id, {
        officerName: currentUser.name,
        beforeImageUrl: beforeImage || undefined,
      });

      setExecutionStep("in_progress");
      onRefreshIssues();
    } catch (err) {
      console.error("Failed to start work:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteWork = async () => {
    if (!activeTask) return;
    setIsProcessing(true);

    const materialsArray = materialsUsedInput
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    try {
      const res = await api.resolveIssue(activeTask.id, {
        officerId: currentUser.id,
        officerName: currentUser.name,
        notes: resolutionNotes || "Repaired and restored to municipal code safety guidelines.",
        afterImageUrl:
          afterImage ||
          "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=600&auto=format&fit=crop&q=80",
        materialsUsed: materialsArray,
      });

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#3b82f6", "#06b6d4"],
      });

      setExecutionStep("completed");
      setActiveTask(res.issue);
      onRefreshIssues();
    } catch (err) {
      console.error("Failed to resolve issue:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#1E2229] border border-[#2D3139] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#F3F4F6]">Field Officer Dispatch Workstation</h2>
            <p className="text-xs text-gray-400">
              Officer: <strong className="text-white">{currentUser.name}</strong> • Unit #{currentUser.department || "Public Works"}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-bold self-start sm:self-auto">
          {officerTasks.length} Active Dispatch Orders
        </span>
      </div>

      {/* Main Execution View: Split or Full Container */}
      {!activeTask ? (
        /* Task Queue List */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F3F4F6]">Priority Dispatched Work Orders</h3>
            <span className="text-xs text-gray-400 font-mono">Sorted by Urgency Score</span>
          </div>

          <div className="space-y-3">
            {officerTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleSelectTask(task)}
                className="cursor-pointer p-5 rounded-2xl bg-[#1E2229] border border-[#2D3139] hover:border-gray-600 shadow-md transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-400">{task.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          task.severity === "Critical"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {task.severity}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                        Priority: {task.priorityScore}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{task.title}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      {task.address}
                    </p>
                  </div>

                  {task.initialImageUrl && (
                    <img
                      src={task.initialImageUrl}
                      alt={task.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SLA: {task.slaHours || 8}h Window</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTask(task);
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    Open Work Order &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Active Job Execution Workspace */
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          {/* Header & Back Action */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {activeTask.id}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 capitalize">
                  {activeTask.status.replace("_", " ")}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">{activeTask.title}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                {activeTask.address}
              </p>
            </div>

            <button
              onClick={() => setActiveTask(null)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
            >
              &larr; Back to Task List
            </button>
          </div>

          {/* Quick Turn-by-Turn GPS Navigation Action */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-300">
              Target Coordinates: <strong className="text-white font-mono">{activeTask.latitude.toFixed(4)}, {activeTask.longitude.toFixed(4)}</strong>
            </div>
            <button
              onClick={() => openNavigation(activeTask)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition"
            >
              <Navigation className="w-4 h-4" />
              Launch Turn-by-Turn Navigation (Google Maps)
            </button>
          </div>

          {/* AI Hazard Briefing Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/30 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              AI Pre-Inspection Hazard Briefing & Safety Checklist
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {(activeTask.aiAnalysis?.safetyRisks || [
                "Establish traffic cones & safety buffer perimeter",
                "Wear high-visibility Class 3 municipal vest",
              ]).map((risk, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* WORKFLOW STEPS */}
          {/* STEP 1: INITIAL INSPECTION & START WORK */}
          {executionStep === "brief" && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Step 1: Arrival & On-Site Verification
              </h4>

              {activeTask.initialImageUrl && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400">Citizen Reported Defect Photo:</span>
                  <img
                    src={activeTask.initialImageUrl}
                    alt="Citizen defect"
                    className="w-full h-56 object-cover rounded-xl border border-slate-800"
                  />
                </div>
              )}

              <button
                onClick={handleStartWork}
                disabled={isProcessing}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Play className="w-4 h-4" />
                {isProcessing ? "Updating Status..." : "Arrived On Site — Start Work (Transition to In Progress)"}
              </button>
            </div>
          )}

          {/* STEP 2: IN PROGRESS & RESOLUTION UPLOAD */}
          {executionStep === "in_progress" && (
            <div className="space-y-5">
              <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-xs text-indigo-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Work order is actively in progress. Clock is running against SLA target.</span>
              </div>

              {/* Upload After Photo */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  Take Post-Repair Verification Photo ("After Photo")
                </label>

                <div
                  onClick={() => afterFileRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-6 bg-slate-950 text-center space-y-2 cursor-pointer transition"
                >
                  <input
                    type="file"
                    ref={afterFileRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setAfterImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {afterImage ? (
                    <img src={afterImage} alt="Repair after" className="h-44 mx-auto rounded-lg object-cover" />
                  ) : (
                    <div className="space-y-1">
                      <Camera className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-xs font-bold text-white">Click to Upload Completed Repair Photo</p>
                      <p className="text-[10px] text-slate-400">Required for citizen sign-off & audit</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Materials Used */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Materials / Equipment Utilized</label>
                <input
                  type="text"
                  value={materialsUsedInput}
                  onChange={(e) => setMaterialsUsedInput(e.target.value)}
                  placeholder="e.g. Type II asphalt patch, 2x steel bolts, conduit sleeve"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Resolution Inspection Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Officer Work Completion Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe repair actions performed, safety standards met, and site clearing..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Resolution Action */}
              <button
                onClick={handleCompleteWork}
                disabled={isProcessing}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isProcessing ? "Committing Resolution..." : "Mark Issue as Resolved (Submit to Citizen for Sign-off)"}
              </button>
            </div>
          )}

          {/* STEP 3: COMPLETED STATE */}
          {executionStep === "completed" && (
            <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Repair Work Order Completed & Submitted!</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  The citizen reporter ({activeTask.reporterName}) has been notified to inspect and verify the repair.
                </p>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => setActiveTask(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
                >
                  Return to Next Dispatched Task &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
