import { useState, useRef, useEffect, type ChangeEvent } from "react";
import {
  Camera,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Shield,
  ThumbsUp,
  Flame,
  ArrowRight,
  RefreshCw,
  Eye,
  Clock,
  Layers,
  ChevronRight,
  UploadCloud,
  FileText,
  Search,
  PlusCircle,
  HelpCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import type { CivicIssue, AIAnalysisResult, User, Severity } from "../types.ts";
import { api } from "../lib/api.ts";
import InteractiveMap from "./InteractiveMap.tsx";

interface CitizenPortalProps {
  currentUser: User;
  onOpenIntegrity: () => void;
  onSelectIssue: (issue: CivicIssue) => void;
  issues: CivicIssue[];
  onRefreshIssues: () => void;
}

export default function CitizenPortal({
  currentUser,
  onOpenIntegrity,
  onSelectIssue,
  issues,
  onRefreshIssues,
}: CitizenPortalProps) {
  const [activeTab, setActiveTab] = useState<"home" | "report" | "my-reports" | "feed">("home");

  // Reporting Form State
  const [reportStep, setReportStep] = useState<"media" | "ai_verify" | "duplicate_modal" | "success">("media");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);

  // Form Fields
  const [issueTitle, setIssueTitle] = useState("");
  const [issueCategory, setIssueCategory] = useState("Roads & Infrastructure");
  const [issueSubcategory, setIssueSubcategory] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueAddress, setIssueAddress] = useState("Market St & 4th Ave, Downtown District");
  const [issueLatitude, setIssueLatitude] = useState(37.7749);
  const [issueLongitude, setIssueLongitude] = useState(-122.4194);
  const [isLocating, setIsLocating] = useState(false);
  const [severity, setSeverity] = useState<Severity>("High");
  const [priorityScore, setPriorityScore] = useState(85);

  // Duplicate Check Modal State
  const [duplicateMatches, setDuplicateMatches] = useState<{
    issue: CivicIssue;
    distanceMeters: number;
    isNearby: boolean;
    isSameCategory: boolean;
    confidence: number;
  }[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [createdIssueId, setCreatedIssueId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Preset Sample Images for Fast Demo
  const DEMO_PRESETS = [
    {
      label: "Road Pothole",
      category: "Roads & Infrastructure",
      url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
      description: "Severe deep asphalt cavity on bus transit lane causing traffic swerving.",
      address: "Market St & 5th Ave, Financial District",
      lat: 37.7842,
      lng: -122.4075,
    },
    {
      label: "Water Main Burst",
      category: "Water & Sewage",
      url: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80",
      description: "High pressure water pipe leaking heavily onto pedestrian walkway.",
      address: "420 Geary St, Theater District",
      lat: 37.7833,
      lng: -122.4167,
    },
    {
      label: "Broken Light Mast",
      category: "Electrical & Lighting",
      url: "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=600&auto=format&fit=crop&q=80",
      description: "Damaged street lamppost with exposed wire bundle near crosswalk.",
      address: "1280 Haight St, The Haight",
      lat: 37.7698,
      lng: -122.4467,
    },
    {
      label: "Illegal Waste Dump",
      category: "Sanitation & Waste",
      url: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80",
      description: "Hazardous debris and toxic waste barrels dumped on sidewalk.",
      address: "Pier 27 Waterfront Promenade",
      lat: 37.8012,
      lng: -122.4019,
    },
  ];

  // Geolocation trigger
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIssueLatitude(pos.coords.latitude);
          setIssueLongitude(pos.coords.longitude);
          setIssueAddress(`GPS Pin (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          setIsLocating(false);
        },
        (err) => {
          console.warn("Geolocation fallback to Downtown metro coordinates:", err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // Process selected image and trigger Gemini Visual Analysis
  const handleImageSelected = async (base64OrUrl: string, sampleDescription?: string) => {
    setCapturedImage(base64OrUrl);
    setReportStep("ai_verify");
    setIsAnalyzingImage(true);

    try {
      // Call server-side Gemini 3.7 Flash analysis endpoint
      const res = await api.analyzeImage(
        base64OrUrl,
        "image/jpeg",
        sampleDescription || issueDescription || "Public municipal infrastructure defect"
      );

      setAiAnalysis(res.analysis);
      setIssueCategory(res.analysis.predictedCategory);
      setIssueSubcategory(res.analysis.subcategory);
      setSeverity(res.analysis.severity);
      setPriorityScore(res.analysis.calculatedPriorityScore);
      if (!issueTitle) {
        setIssueTitle(`${res.analysis.subcategory} reported at ${issueAddress.split(",")[0]}`);
      }
      if (!issueDescription) {
        setIssueDescription(res.analysis.summary);
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleImageSelected(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Perform Duplicate Check before final submission
  const handleInitiateSubmission = async () => {
    setIsCheckingDuplicates(true);
    try {
      const dupRes = await api.checkDuplicates(issueLatitude, issueLongitude, issueCategory, 80);
      if (dupRes.hasDuplicates && dupRes.duplicates.length > 0) {
        setDuplicateMatches(dupRes.duplicates);
        setReportStep("duplicate_modal");
      } else {
        await executeFinalSubmission();
      }
    } catch (err) {
      console.error("Duplicate check failed, proceeding to direct submission:", err);
      await executeFinalSubmission();
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Execute Final Issue Creation
  const executeFinalSubmission = async () => {
    setIsSubmittingReport(true);
    try {
      const res = await api.createIssue({
        title: issueTitle || `${issueSubcategory || "Civic Defect"} at ${issueAddress.split(",")[0]}`,
        category: issueCategory,
        subcategory: issueSubcategory || "Infrastructure Defect",
        description: issueDescription,
        latitude: issueLatitude,
        longitude: issueLongitude,
        address: issueAddress,
        severity,
        priorityScore,
        initialImageUrl: capturedImage || undefined,
        aiAnalysis: aiAnalysis || undefined,
        userId: currentUser.id,
        reporterName: currentUser.name,
      });

      setCreatedIssueId(res.issue.id);
      setReportStep("success");
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 },
      });
      onRefreshIssues();
    } catch (err) {
      console.error("Submit report error:", err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Handle +1 Upvote from Duplicate Intercept Modal
  const handleConfirmDuplicateUpvote = async (targetIssueId: string) => {
    try {
      const res = await api.upvoteIssue(targetIssueId, currentUser.id);
      confetti({ particleCount: 80, spread: 50 });
      onRefreshIssues();
      onSelectIssue(res.issue);
      setReportStep("media");
      setActiveTab("my-reports");
    } catch (err) {
      console.error("Upvote error:", err);
    }
  };

  const myReportsList = issues.filter((i) => i.userId === currentUser.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Top Banner & Quick Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#1E2229] border border-[#2D3139] shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <h2 className="text-lg font-bold text-[#F3F4F6]">Citizen Accountability Dashboard</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Welcome back, <strong className="text-white">{currentUser.name}</strong> • AI Visual Triage & Integrity Protection Active
          </p>
        </div>

        {/* Portal Switching Tabs */}
        <div className="flex items-center gap-1.5 bg-[#0F1115] p-1.5 rounded-xl border border-[#2D3139]">
          <button
            onClick={() => setActiveTab("home")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "home" ? "bg-[#1E2229] text-blue-400 border border-blue-500/20 shadow-sm" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => {
              setActiveTab("report");
              setReportStep("media");
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "report" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Report Issue
          </button>
          <button
            onClick={() => setActiveTab("my-reports")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "my-reports" ? "bg-[#1E2229] text-blue-400 border border-blue-500/20" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            My Reports ({myReportsList.length})
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "feed" ? "bg-[#1E2229] text-white border border-[#2D3139]" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Live City Feed
          </button>
        </div>
      </div>

      {/* TAB 1: HOME DASHBOARD */}
      {activeTab === "home" && (
        <div className="space-y-6">
          {/* Main Action Trigger Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action 1: Report Civic Issue */}
            <div
              onClick={() => {
                setActiveTab("report");
                setReportStep("media");
              }}
              className="group cursor-pointer p-6 rounded-2xl bg-[#1E2229] border border-[#2D3139] hover:border-blue-500/50 shadow-lg transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  AI Triage Active
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-4 flex items-center gap-1.5">
                Report Public Defect
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Take a photo of potholes, water leaks, broken streetlights, or sanitation hazards. Gemini AI automatically classifies severity and alerts the municipal department.
              </p>
              <div className="mt-4 pt-4 border-t border-[#2D3139] flex items-center justify-between text-[11px] text-blue-400 font-medium">
                <span>Instant GPS Tagging • Duplicate Prevention</span>
                <span className="font-bold">Start Report &rarr;</span>
              </div>
            </div>

            {/* Action 2: Civic Integrity Vault */}
            <div
              onClick={onOpenIntegrity}
              className="group cursor-pointer p-6 rounded-2xl bg-[#1E2229] border border-[#2D3139] hover:border-red-500/50 shadow-lg transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-105 transition">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  Secure Whistleblower
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-4 flex items-center gap-1.5">
                Civic Integrity Vault
                <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Submit encrypted, metadata-scrubbed whistleblowing disclosures on municipal corruption, bid rigging, and extortion. SHA-256 tamper-evident verification.
              </p>
              <div className="mt-4 pt-4 border-t border-[#2D3139] flex items-center justify-between text-[11px] text-red-400 font-medium">
                <span>Zero-Knowledge • Encrypted Ledger</span>
                <span className="font-bold">Open Vault &rarr;</span>
              </div>
            </div>
          </div>

          {/* Citizen Map View: Active Issues in Neighborhood */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Neighborhood Live Issue Map</h3>
                <p className="text-xs text-slate-400">Click any marker to view report status or +1 confirm</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800">
                {issues.length} Active Public Issues
              </span>
            </div>
            <div className="h-80 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
              <InteractiveMap issues={issues} onSelectIssue={onSelectIssue} />
            </div>
          </div>

          {/* Recent Reports Highlights */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">High Urgency Neighborhood Alerts</h3>
              <button
                onClick={() => setActiveTab("feed")}
                className="text-xs text-cyan-400 hover:underline font-medium"
              >
                View all &rarr;
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {issues.slice(0, 4).map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  className="cursor-pointer p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex items-start gap-3"
                >
                  {issue.initialImageUrl ? (
                    <img
                      src={issue.initialImageUrl}
                      alt={issue.title}
                      className="w-16 h-16 rounded-lg object-cover border border-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-cyan-400 font-mono">{issue.id}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                          issue.severity === "Critical"
                            ? "bg-rose-950 text-rose-300 border-rose-800 animate-pulse"
                            : issue.severity === "High"
                            ? "bg-orange-950 text-orange-300 border-orange-800"
                            : "bg-blue-950 text-blue-300 border-blue-800"
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate">{issue.title}</h4>
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                      {issue.address}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPORT AN ISSUE WORKFLOW */}
      {activeTab === "report" && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          {/* Workflow Header Steps */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                Submit Civic Defect Report
              </h2>
              <p className="text-xs text-slate-400">Step {reportStep === "media" ? "1" : "2"} of 2: Visual Capture & AI Verification</p>
            </div>
            <button
              onClick={() => setActiveTab("home")}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
          </div>

          {/* STEP A: MEDIA & LOCATION CAPTURE */}
          {reportStep === "media" && (
            <div className="space-y-6">
              {/* Photo Capture Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Capture or Upload Defect Photo
                </label>

                {/* Drag & Drop Upload Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-8 bg-slate-950/60 hover:bg-slate-950 transition text-center space-y-3"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-cyan-600/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto group-hover:scale-110 transition">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Click to Take Camera Photo or Upload File</p>
                    <p className="text-xs text-slate-400 mt-1">Supports High-Resolution JPEG, PNG, WEBP</p>
                  </div>
                </div>

                {/* Quick Presets for Demo */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] text-slate-400 font-medium">Or select a high-resolution simulation sample:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DEMO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setIssueAddress(preset.address);
                          setIssueLatitude(preset.lat);
                          setIssueLongitude(preset.lng);
                          handleImageSelected(preset.url, preset.description);
                        }}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-left transition group space-y-1"
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-14 object-cover rounded-lg group-hover:opacity-90"
                        />
                        <div className="text-[11px] font-semibold text-slate-200 truncate">{preset.label}</div>
                        <div className="text-[9px] text-cyan-400 truncate">{preset.category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location Selector */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    2. Location & GPS Geo-Lock
                  </label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/80 transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLocating ? "animate-spin" : ""}`} />
                    {isLocating ? "Acquiring GPS..." : "Auto-Detect Current GPS"}
                  </button>
                </div>

                <input
                  type="text"
                  value={issueAddress}
                  onChange={(e) => setIssueAddress(e.target.value)}
                  placeholder="Street address or landmark description"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />

                {/* Map Pin Adjuster */}
                <div className="h-44 rounded-xl overflow-hidden border border-slate-800">
                  <InteractiveMap
                    issues={[]}
                    center={[issueLatitude, issueLongitude]}
                    interactivePinLocation={[issueLatitude, issueLongitude]}
                    onPinChange={(lat, lng) => {
                      setIssueLatitude(lat);
                      setIssueLongitude(lng);
                      setIssueAddress(`Adjusted Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                    }}
                    isPinDraggable={true}
                    zoom={15}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP B: AI VISUAL VERIFICATION & SUBMISSION */}
          {reportStep === "ai_verify" && (
            <div className="space-y-6">
              {/* Photo Preview + AI Analysis Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-56 relative">
                  {capturedImage && (
                    <img src={capturedImage} alt="Captured defect" className="w-full h-full object-cover" />
                  )}
                  {isAnalyzingImage && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-2">
                      <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
                      <p className="text-xs font-bold text-white">Gemini 3.7 Vision Analyzing...</p>
                      <p className="text-[10px] text-slate-400">Classifying severity, hazards & routing</p>
                    </div>
                  )}
                </div>

                {/* AI Classification Insights */}
                <div className="md:col-span-2 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      AI Visual Triage Prediction
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded border border-indigo-800">
                      {(aiAnalysis?.confidence ? aiAnalysis.confidence * 100 : 96).toFixed(0)}% Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Assigned Category</span>
                      <p className="text-xs font-bold text-white mt-0.5 truncate">{issueCategory}</p>
                    </div>
                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Computed Severity</span>
                      <p className="text-xs font-bold text-rose-400 mt-0.5">{severity} Urgency</p>
                    </div>
                  </div>

                  {/* Priority Score Bar (0 - 100) */}
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        Calculated Priority Score:
                      </span>
                      <strong className="text-amber-400 font-mono text-sm">{priorityScore} / 100</strong>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${priorityScore}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Formula: (Severity Weight 40%) + (Traffic Risk 20%) + (Public Impact 15%) + (Duplicate Boost)
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable Form Details */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Report Title</label>
                  <input
                    type="text"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. Deep Pothole on Market St"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Category Override</label>
                    <select
                      value={issueCategory}
                      onChange={(e) => setIssueCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                      <option value="Water & Sewage">Water & Sewage</option>
                      <option value="Electrical & Lighting">Electrical & Lighting</option>
                      <option value="Sanitation & Waste">Sanitation & Waste</option>
                      <option value="Parks & Public Spaces">Parks & Public Spaces</option>
                      <option value="Public Safety & Encroachment">Public Safety & Encroachment</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Severity Rating</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as Severity)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Critical">Critical (Immediate hazard)</option>
                      <option value="High">High (High safety impact)</option>
                      <option value="Medium">Medium (General repair)</option>
                      <option value="Low">Low (Minor cosmetic)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Additional Field Notes / Description</label>
                  <textarea
                    rows={3}
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Provide any specific details regarding damage, nearby hazards, or vehicle impacts..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReportStep("media")}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
                >
                  &larr; Retake Photo
                </button>
                <button
                  type="button"
                  onClick={handleInitiateSubmission}
                  disabled={isCheckingDuplicates || isSubmittingReport}
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  {isCheckingDuplicates
                    ? "Checking Duplicates in Radius..."
                    : isSubmittingReport
                    ? "Routing to Department..."
                    : "Confirm & Submit Civic Report"}
                </button>
              </div>
            </div>
          )}

          {/* STEP C: DUPLICATE DETECTION INTERCEPT MODAL */}
          {reportStep === "duplicate_modal" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-200">Potential Duplicate Issues Detected Nearby!</h3>
                  <p className="text-xs text-amber-300/80 mt-0.5">
                    We found an existing active report within <strong>80 meters</strong> of your location. To avoid duplicate work orders, you can <strong>+1 Upvote</strong> the existing ticket instead of creating a new one.
                  </p>
                </div>
              </div>

              {/* List of Duplicate Matches */}
              <div className="space-y-3">
                {duplicateMatches.map(({ issue: dupIssue, distanceMeters }) => (
                  <div
                    key={dupIssue.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400">{dupIssue.id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                            {distanceMeters}m away
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 capitalize">
                            {dupIssue.status.replace("_", " ")}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1">{dupIssue.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{dupIssue.description}</p>
                      </div>
                      {dupIssue.initialImageUrl && (
                        <img
                          src={dupIssue.initialImageUrl}
                          alt="Existing issue"
                          className="w-16 h-16 rounded-lg object-cover border border-slate-800 shrink-0 ml-3"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                      <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        {dupIssue.reportCount} reports • {dupIssue.upvotes} upvotes
                      </span>
                      <button
                        type="button"
                        onClick={() => handleConfirmDuplicateUpvote(dupIssue.id)}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        +1 Upvote This Existing Issue
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReportStep("ai_verify")}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  &larr; Back to Edit
                </button>
                <button
                  type="button"
                  onClick={executeFinalSubmission}
                  disabled={isSubmittingReport}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                >
                  No, Submit As Distinct Separate Issue &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP D: SUBMISSION SUCCESS SCREEN */}
          {reportStep === "success" && (
            <div className="py-10 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Civic Issue Submitted Successfully!</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Ticket <strong className="text-cyan-400 font-mono">{createdIssueId}</strong> has been created and automatically routed to the responsible municipal department.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setActiveTab("my-reports");
                    setReportStep("media");
                  }}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  Track in My Reports &rarr;
                </button>
                <button
                  onClick={() => {
                    setReportStep("media");
                    setCapturedImage(null);
                    setIssueTitle("");
                    setIssueDescription("");
                  }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition"
                >
                  Report Another Defect
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY REPORTS TRACKER */}
      {activeTab === "my-reports" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">My Submitted Reports</h3>
              <p className="text-xs text-slate-400">Track progress from initial dispatch to citizen verification</p>
            </div>
            <button
              onClick={() => {
                setActiveTab("report");
                setReportStep("media");
              }}
              className="px-3.5 py-1.5 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Report
            </button>
          </div>

          {myReportsList.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">You haven't submitted any civic defect reports yet.</p>
              <button
                onClick={() => {
                  setActiveTab("report");
                  setReportStep("media");
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Submit Your First Report
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myReportsList.map((issue) => (
                <div
                  key={issue.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">{issue.id}</span>
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {issue.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Priority: {issue.priorityScore}/100
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{issue.title}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        {issue.address}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectIssue(issue)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-400 transition"
                    >
                      View Details &rarr;
                    </button>
                  </div>

                  {/* Visual Step-by-Step Progress Pipeline */}
                  <div className="pt-2">
                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {[
                        { key: "submitted", label: "Submitted" },
                        { key: "assigned", label: "Assigned" },
                        { key: "in_progress", label: "In Progress" },
                        { key: "resolved", label: "Resolved" },
                        { key: "verified", label: "Verified" },
                      ].map((step, idx) => {
                        const stepOrder = ["submitted", "assigned", "in_progress", "resolved", "verified"];
                        const currentIdx = stepOrder.indexOf(issue.status);
                        const isDone = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <div key={step.key} className="space-y-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                isDone
                                  ? "bg-cyan-500"
                                  : "bg-slate-800"
                              }`}
                            />
                            <span
                              className={`text-[10px] font-semibold block ${
                                isCurrent
                                  ? "text-cyan-400 font-bold"
                                  : isDone
                                  ? "text-slate-300"
                                  : "text-slate-600"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Citizen Verification Callout if in 'resolved' state */}
                  {issue.status === "resolved" && (
                    <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-600/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Repair Sign-off Ready for Inspection</p>
                          <p className="text-[11px] text-indigo-300">
                            Officer uploaded after-photo. Click to confirm repair satisfaction.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onSelectIssue(issue)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition shrink-0"
                      >
                        Verify Repair
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CITY LIVE FEED */}
      {activeTab === "feed" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">City-wide Live Issue Feed</h3>
            <span className="text-xs font-mono text-slate-400">{issues.length} Total Registered Tickets</span>
          </div>

          <div className="space-y-3">
            {issues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className="cursor-pointer p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-start gap-4"
              >
                {issue.initialImageUrl ? (
                  <img
                    src={issue.initialImageUrl}
                    alt={issue.title}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-800 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-cyan-400 font-mono">{issue.id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        Score: {issue.priorityScore}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 capitalize">
                        {issue.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{issue.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{issue.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>📍 {issue.address}</span>
                    <span className="font-semibold text-amber-400">🔥 {issue.reportCount} reports</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
