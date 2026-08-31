import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect, type ChangeEvent } from "react";
import {
  Camera,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Shield,
  ThumbsUp,
  ArrowRight,
  RefreshCw,
  ChevronRight,
  UploadCloud,
  FileText,
  PlusCircle,
  HelpCircle,
} from "lucide-react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import { submitCivicIssue, analyzeImage } from "../lib/api";
import EXIF from "exif-js";
import SubmissionSuccessModal from "./SubmissionSuccessModal";

function convertDMSToDD(degrees: number[], ref: string) {
  if (!degrees || degrees.length < 3) return null;
  const d = degrees[0];
  const m = degrees[1];
  const s = degrees[2];
  let dd = d + m / 60 + s / 3600;
  if (ref === "S" || ref === "W") {
    dd = dd * -1;
  }
  return dd;
}

interface TiltBentoCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className: string;
  glowColor?: string;
  variants: any;
}

function TiltBentoCard({
  children,
  onClick,
  className,
  glowColor = "hover:border-[#00F2FE]/40 hover:shadow-[#00F2FE]/5",
  variants,
}: TiltBentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useTransform(y, [0, 1], [6, -6]);
  const rotateY = useTransform(x, [0, 1], [-6, 6]);

  const springRotateX = useSpring(rotateX, { stiffness: 120, damping: 18 });
  const springRotateY = useSpring(rotateY, { stiffness: 120, damping: 18 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={cardRef}
      variants={variants}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className={`${className} ${glowColor}`}
    >
      <div style={{ transform: "translateZ(20px)", transformStyle: "preserve-3d" }} className="h-full flex flex-col justify-between">
        {children}
      </div>
    </motion.div>
  );
}


import { translate } from "../lib/i18n";
import { VoiceField } from "./VoiceControls";
import type { Language, CivicIssue, AIAnalysisResult, User, Severity } from "../types";
import InteractiveMap from "./InteractiveMap";
import confetti from "canvas-confetti";
import { validateImage } from "../lib/imageValidation";
import { createDemoReportId, loadDemoReports, saveDemoReport, updateDemoReport, loadDemoComplaints, saveDemoComplaint } from "../lib/demoStorage";
import TrafficReportForm from "./TrafficReportForm";
import ComplaintMap from "./ComplaintMap";
import type { ComplaintRecord } from "../lib/complaintData";
import { verifyCivicDefect, type AIVerificationResult } from "../lib/aiVerification";

interface CitizenPortalProps {
  currentUser: User;
  language: Language;
  onOpenIntegrity: () => void;
  onSelectIssue: (issue: CivicIssue) => void;
  issues: CivicIssue[];
  onRefreshIssues: () => void;
  onReportCreated: (report: CivicIssue) => void;
  voiceOpenReport?: number;
}

export default function CitizenPortal({
  currentUser,
  language,
  onOpenIntegrity,
  onSelectIssue,
  issues,
  onRefreshIssues,
  onReportCreated,
  voiceOpenReport = 0,
}: CitizenPortalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"home" | "report" | "my-reports" | "feed">("home");
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState(false);
  const [complaintFormCategory, setComplaintFormCategory] = useState<"Traffic Jam" | "Food & Health Standards" | "Illegal Parking">("Traffic Jam");
  const [complaintRecords, setComplaintRecords] = useState<ComplaintRecord[]>(() => loadDemoComplaints());

  // Reporting Form State
  const [reportStep, setReportStep] = useState<"media" | "ai_verify" | "duplicate_modal" | "success">("media");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiVerification, setAiVerification] = useState<AIVerificationResult | null>(null);
  const [isVerifyingImage, setIsVerifyingImage] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Form Fields
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueCategory, setIssueCategory] = useState("");
  const [issueSubcategory, setIssueSubcategory] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueAddress, setIssueAddress] = useState("");
  const [issueLatitude, setIssueLatitude] = useState(19.0760);
  const [issueLongitude, setIssueLongitude] = useState(72.8777);
  const [isLocating, setIsLocating] = useState(false);

  // Automatically fetch GPS on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIssueLatitude(pos.coords.latitude);
          setIssueLongitude(pos.coords.longitude);
          setIssueAddress(`GPS Pin (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        (err) => {
          console.warn("Geolocation fallback to Mumbai metro coordinates:", err);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);
  const [severity, setSeverity] = useState<Severity | "">("");

  useEffect(() => {
    if (voiceOpenReport > 0) {
      setActiveTab("report");
      setReportStep("media");
    }
  }, [voiceOpenReport]);

  // Duplicate Check Modal State
  const [duplicateMatches, setDuplicateMatches] = useState<{
    issue: CivicIssue;
    distanceMeters: number;
    isNearby: boolean;
    isSameCategory: boolean;
  }[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [createdIssueId, setCreatedIssueId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState("");
  const [imageValidationError, setImageValidationError] = useState("");

  // AI Query Simulator State
  const [simQueryIndex, setSimQueryIndex] = useState(0);
  const [simText, setSimText] = useState("");
  const [isSimTyping, setIsSimTyping] = useState(true);

  const SIM_QUERIES = [
    {
      query: "Querying: Active water line leaks and emergency dispatch latency...",
      answer: "STATUS: 2 incidents active. Average response time: 24 mins. Dispatch routed: Water Utility Unit B."
    },
    {
      query: "Querying: Streetlight integrity metrics and grid outages...",
      answer: "STATUS: 98.4% uptime. 3 repairs queued. Next cycle scheduled: Haight-Ashbury District."
    },
    {
      query: "Querying: SHA-256 ledger disclosures for public compliance...",
      answer: "STATUS: 12 audits validated. Zero integrity discrepancies detected."
    }
  ];

  useEffect(() => {
    let queryTimer: number;
    let charIndex = 0;
    const current = SIM_QUERIES[simQueryIndex];
    setSimText("");
    setIsSimTyping(true);

    const typeChar = () => {
      if (charIndex < current.query.length) {
        setSimText((prev) => prev + current.query.charAt(charIndex));
        charIndex++;
        queryTimer = window.setTimeout(typeChar, 30);
      } else {
        setIsSimTyping(false);
        queryTimer = window.setTimeout(() => {
          setSimText(current.query + "\n" + current.answer);
        }, 400);
      }
    };

    typeChar();

    const cycleTimer = window.setTimeout(() => {
      setSimQueryIndex((prev) => (prev + 1) % SIM_QUERIES.length);
    }, 7000);

    return () => {
      window.clearTimeout(queryTimer);
      window.clearTimeout(cycleTimer);
    };
  }, [simQueryIndex]);

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
          console.warn("Geolocation fallback to Mumbai metro coordinates:", err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const handleImageSelected = async (base64OrUrl: string, fileName: string = "") => {
    setImageValidationError("");
    setCapturedImage(base64OrUrl);
    setReportStep("ai_verify");
    setIsAnalyzingImage(true);

    try {
      const response = await analyzeImage(base64OrUrl);
      const analysis = response.analysis as AIAnalysisResult;

      setAiAnalysis(analysis);
      setIssueCategory(analysis.predictedCategory);
      setIssueSubcategory(analysis.subcategory);
      setSeverity(analysis.severity);
      if (!issueTitle) setIssueTitle(`${analysis.subcategory} reported at ${issueAddress.split(",")[0]}`);
      if (!issueDescription) setIssueDescription(analysis.summary);
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      setImageValidationError(err.message || "Failed to analyze image with CivicAI.");
      setReportStep("media");
      setCapturedImage(null);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const processFile = async (file: File) => {
    setImageValidationError("");
    setAiVerification(null);
    if (!file.type.startsWith("image/")) {
      setCapturedImage(null);
      setImageValidationError("Please upload a valid image file (JPEG, PNG, WEBP, HEIC).");
      return;
    }

    setIsVerifyingImage(true);
    try {
      const verificationResult = await verifyCivicDefect(file);
      if (!verificationResult.valid) {
        setImageValidationError(verificationResult.reason || "Image verification failed.");
        setCapturedImage(null);
        return;
      }

      setAiVerification(verificationResult);
      if (verificationResult.exifTags) {
        const lat = verificationResult.exifTags.lat;
        const latRef = verificationResult.exifTags.latRef;
        const lng = verificationResult.exifTags.lng;
        const lngRef = verificationResult.exifTags.lngRef;
        if (lat && latRef && lng && lngRef) {
          const latitude = convertDMSToDD(lat, latRef);
          const longitude = convertDMSToDD(lng, lngRef);
          if (latitude !== null && longitude !== null) {
            setIssueLatitude(latitude);
            setIssueLongitude(longitude);
            setIssueAddress(`GPS Pin (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          }
        }
      }

      const reader = new FileReader();
      reader.onload = () => {
        void handleImageSelected(reader.result as string, file.name);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setImageValidationError("An error occurred during verification.");
    } finally {
      setIsVerifyingImage(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = "";
  };

  // Demo submissions are local and do not require a duplicate-check API.
  const handleInitiateSubmission = async () => {
    setIsCheckingDuplicates(false);
    await executeFinalSubmission();
  };

  // Execute Final Issue Creation
  const executeFinalSubmission = async () => {
    setIsSubmittingReport(true);
    setSubmissionError("");
    try {
      const refId = `ISS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const complaintPayload = {
        title: issueTitle || `${issueSubcategory || "Civic Defect"} at ${issueAddress.split(",")[0]}`,
        category: issueCategory,
        subcategory: issueSubcategory || "Infrastructure Defect",
        description: issueDescription,
        latitude: issueLatitude,
        longitude: issueLongitude,
        address: issueAddress,
        severity: severity || undefined,
        initialImageUrl: capturedImage || undefined,
        aiAnalysis: aiAnalysis || undefined,
        userId: currentUser.id,
        reporterName: currentUser.name,
        website: "",
        sourceLanguage: language,
        isAnonymous
      };

      const localRecord = {
        id: refId,
        category: issueCategory,
        subtype: issueSubcategory || "Infrastructure Defect",
        description: issueDescription,
        location: issueAddress,
        coordinates: { lat: issueLatitude, lng: issueLongitude },
        photoUrl: capturedImage,
        timestamp: new Date().toISOString(),
        status: "Pending"
      };

      try {
        const stored = JSON.parse(localStorage.getItem("civic_complaints") || "[]");
        stored.push(localRecord);
        localStorage.setItem("civic_complaints", JSON.stringify(stored));
        window.dispatchEvent(new CustomEvent("new_complaint_added"));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}

      const { issue } = await submitCivicIssue(complaintPayload);
      issue.id = refId;

      onReportCreated(issue);
      setCreatedIssueId(refId);
      setReportStep("success");
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error("Submit report error:", err);
      setSubmissionError("We could not save your complaint. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleConfirmDuplicateUpvote = async (targetIssueId: string) => {
    try {
      const response = await fetch(`/api/v1/issues/${targetIssueId}/upvote`, {
        method: "POST",
      });
      if (response.ok) {
        confetti({ particleCount: 80, spread: 50 });
        onRefreshIssues();
        setReportStep("media");
        setActiveTab("my-reports");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const myReportsList = issues.filter((i) => i.userId === currentUser.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Top Banner & Quick Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface shadow-md shadow-md border border-border-subtle shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <h2 className="text-lg font-bold text-[#F3F4F6]">{t('Citizen Accountability Dashboard')}</h2>
          </div>
          <p className="text-xs text-foreground/60 mt-1">
            Welcome back, <strong className="text-foreground">{currentUser.name}</strong> • AI Visual Triage & Integrity Protection Active
          </p>
        </div>

        {/* Portal Switching Tabs */}
        <div className="flex items-center gap-1.5 bg-background p-1.5 rounded-xl border border-border-subtle">
          <button
            onClick={() => setActiveTab("home")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "home" ? "bg-surface text-blue-400 border border-blue-500/20 shadow-sm" : "text-foreground/60 hover:text-gray-200"
              }`}
          >
            Home
          </button>
          <button
            onClick={() => {
              setActiveTab("report");
              setReportStep("media");
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === "report" ? "bg-blue-600 text-foreground shadow-sm" : "text-foreground/60 hover:text-gray-200"
              }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />{t('Report Issue')}</button>
          <button
            onClick={() => setActiveTab("my-reports")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === "my-reports" ? "bg-surface text-blue-400 border border-blue-500/20" : "text-foreground/60 hover:text-gray-200"
              }`}
          >
            My Reports ({myReportsList.length})
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "feed" ? "bg-surface text-foreground border border-border-subtle" : "text-foreground/60 hover:text-gray-200"
              }`}
          >
            Live City Feed
          </button>
        </div>
      </div>

      {/* TAB 1: HOME DASHBOARD */}
      {activeTab === "home" && (
        <div className="space-y-8">
          
          {/* Immersive Hero Section */}
          <div className="text-center py-6 px-4 max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-foreground">
              Collective Action & <span className="gradient-text-cyan-indigo">Civic Intelligence</span>
            </h2>
            <p className="text-xs sm:text-sm text-foreground/60 max-w-lg mx-auto leading-relaxed">
              Report municipal issues instantly, securely audit whistleblowing disclosures, and track response metrics across your city.
            </p>
            
            {/* AI Query Simulator Card */}
            <div className="max-w-lg mx-auto mt-6 p-4 rounded-xl border border-border-subtle bg-surface/30 backdrop-blur-md font-mono text-[11px] text-left relative overflow-hidden shadow-xl shadow-cyan-500/5">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F2FE] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F2FE]"></span>
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/80">Live AI Query Simulator</span>
                </div>
                <span className="text-[8px] text-[#00F2FE]/80 font-bold bg-[#00F2FE]/10 px-2 py-0.5 rounded">Active Engine</span>
              </div>
              <div className="min-h-[4.5rem] whitespace-pre-wrap leading-relaxed text-foreground/80">
                {simText}
                {isSimTyping && <span className="w-1.5 h-3 ml-1 bg-[#00F2FE] inline-block animate-pulse">|</span>}
              </div>
            </div>
          </div>

          {/* Bento Grid Architecture */}
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento Card 1: Report Issue */}
              <TiltBentoCard
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                }}
                onClick={() => {
                  setActiveTab("report");
                  setReportStep("media");
                }}
                className="md:col-span-1 glass-panel p-6 rounded-2xl cursor-pointer group relative overflow-hidden min-h-[220px]"
                glowColor="hover:border-[#00F2FE]/40 hover:shadow-[#00F2FE]/5"
              >
                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#00F2FE]/5 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                <div style={{ transform: "translateZ(10px)" }}>
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#00F2FE]/10 border border-[#00F2FE]/20 flex items-center justify-center text-[#00F2FE] group-hover:scale-105 transition">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/20">
                      AI Triage Active
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-foreground mt-4 flex items-center gap-1.5">
                    Departmental Service Hub
                    <ArrowRight className="w-4 h-4 text-[#00F2FE] group-hover:translate-x-1 transition" />
                  </h3>
                  <p className="text-xs text-foreground/60 mt-2 leading-relaxed">
                    Take a photo of road potholes, water leaks, broken lampposts, or sanitation hazards. Gemini AI automatically classifies severity and alerts correct municipal routing.
                  </p>
                </div>
                <div style={{ transform: "translateZ(5px)" }} className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between text-[10px] text-[#00F2FE] font-bold">
                  <span>Instant GPS Tagging • Duplicate Prevention</span>
                  <span>Start Report &rarr;</span>
                </div>
              </TiltBentoCard>

              {/* Bento Card 2: Traffic, Parking & Health Hub */}
              <TiltBentoCard
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                }}
                onClick={() => {
                  setComplaintFormCategory("Traffic Jam");
                  setIsTrafficModalOpen(true);
                }}
                className="md:col-span-1 glass-panel p-6 rounded-2xl cursor-pointer group relative overflow-hidden min-h-[220px] border-amber-500/20"
                glowColor="hover:border-amber-500/40 hover:shadow-amber-500/5"
              >
                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                <div style={{ transform: "translateZ(10px)" }}>
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      CIVIC & HEALTH UNIT
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-foreground mt-4 flex items-center gap-1.5">
                    Traffic, Parking & Health Hub
                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition" />
                  </h3>
                  <p className="text-xs text-foreground/60 mt-2 leading-relaxed">
                    Report traffic jams, illegal parking, food safety violations, hospital issues, or public health hazards. Extract GPS directly from photo evidence.
                  </p>
                </div>
                <div style={{ transform: "translateZ(5px)" }} className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between text-[10px] text-amber-400 font-bold">
                  <span>EXIF GPS • Map Tagging • Food & Traffic</span>
                  <span>File Complaint &rarr;</span>
                </div>
              </TiltBentoCard>

              {/* Bento Card 3: Integrity Vault */}
              <TiltBentoCard
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                }}
                onClick={onOpenIntegrity}
                className="md:col-span-1 glass-panel p-6 rounded-2xl cursor-pointer group relative overflow-hidden min-h-[220px] border-[#6366F1]/20"
                glowColor="hover:border-[#6366F1]/40 hover:shadow-[#6366F1]/5"
              >
                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#6366F1]/5 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                <div style={{ transform: "translateZ(10px)" }}>
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1] group-hover:scale-105 transition">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Secure Ledger
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-foreground mt-4 flex items-center gap-1.5">
                    Integrity & Legal Shield
                    <ArrowRight className="w-4 h-4 text-[#6366F1] group-hover:translate-x-1 transition" />
                  </h3>
                  <p className="text-xs text-foreground/60 mt-2 leading-relaxed">
                    Submit metadata-scrubbed whistleblowing disclosures on municipal corruption with SHA-256 ledger security.
                  </p>
                </div>
                <div style={{ transform: "translateZ(5px)" }} className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between text-[10px] text-[#6366F1] font-bold">
                  <span>Zero-Knowledge • Vetted Audit</span>
                  <span>Open Vault &rarr;</span>
                </div>
              </TiltBentoCard>
            </div>

            {/* Bottom Section */}
            <div className="w-full space-y-6">
              {/* Bento Card: Interactive Map */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
                }}
                className="w-full space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">{t('Neighborhood Live Issue Map')}</h3>
                    <p className="text-[10px] text-foreground/60">Click marker to view status or +1 upvote</p>
                  </div>
                  <span className="text-[10px] font-mono text-[#00F2FE] bg-[#00F2FE]/10 px-2.5 py-1 rounded-lg border border-[#00F2FE]/20">
                    {issues.length} Civic · {complaintRecords.length} Safety Reports
                  </span>
                </div>
                <div className="h-[450px] rounded-2xl overflow-hidden border border-border-subtle shadow-2xl relative">
                  <ComplaintMap
                    civicIssues={issues}
                    onSelectCivicIssue={onSelectIssue}
                    complaintRecords={complaintRecords}
                    center={[issueLatitude, issueLongitude]}
                    showFilterBar={true}
                    className="w-full h-full"
                  />
                </div>
              </motion.div>
            </div>

            {/* Bento Card 4: AI Triage Engine Node Stats */}
            <TiltBentoCard
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
              }}
              className="glass-panel p-6 rounded-2xl flex flex-col justify-between max-w-sm mx-auto"
              glowColor="hover:border-[#00F2FE]/40 hover:shadow-[#00F2FE]/5"
            >
              <div style={{ transform: "translateZ(10px)" }} className="w-full">
                <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">AI Operations status</h3>
                <p className="text-[10px] text-foreground/60 mt-0.5">Automated triage & ledger nodes</p>
              </div>
              
              <div style={{ transform: "translateZ(8px)" }} className="space-y-2.5 font-mono text-[10px] my-4 w-full">
                <div className="flex items-center justify-between border-b border-border-subtle pb-1.5">
                  <span className="text-foreground/60">Visual Engine</span>
                  <span className="text-[#00F2FE] font-bold">Online</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-subtle pb-1.5">
                  <span className="text-foreground/60">Triage Routing</span>
                  <span className="text-[#00F2FE] font-bold">Auto</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-subtle pb-1.5">
                  <span className="text-foreground/60">Ledger Sign</span>
                  <span className="text-[#6366F1] font-bold">SHA-256</span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-foreground/60">SLA Accuracy</span>
                  <span className="text-india-green font-bold">92.4%</span>
                </div>
              </div>

              <div style={{ transform: "translateZ(5px)" }} className="w-full">
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
                  className="w-full py-2 rounded-xl bg-ashoka-navy/5 border border-border-subtle hover:border-[#00F2FE]/30 hover:bg-[#00F2FE]/5 text-[10px] font-bold text-foreground/80 hover:text-foreground transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00F2FE]" />
                  <span>Search Policy Library</span>
                </button>
              </div>
            </TiltBentoCard>

            {/* Traffic Report Modal Overlay */}
            {isTrafficModalOpen && (
              <motion.div
                key="traffic-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) setIsTrafficModalOpen(false); }}
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-full max-w-lg bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-foreground">File a Complaint</h2>
                        <p className="text-[10px] text-foreground/50">Food &amp; Health · Traffic · Parking</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsTrafficModalOpen(false)}
                      className="w-8 h-8 rounded-lg border border-border-subtle flex items-center justify-center text-foreground/40 hover:text-foreground hover:border-foreground/20 transition"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                  {/* Modal Body */}
                  <div className="overflow-y-auto max-h-[80vh] px-6 py-5">
                    <TrafficReportForm
                      initialCategory={complaintFormCategory}
                      onClose={() => setIsTrafficModalOpen(false)}
                      onComplaintSubmitted={(record) => {
                        setComplaintRecords(prev => [record, ...prev]);
                        saveDemoComplaint(record);
                      }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Bento Card 5: High Urgency Neighborhood Alerts Feed */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
              }}
              className="md:col-span-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">High Urgency Alerts</h3>
                <button
                  onClick={() => setActiveTab("feed")}
                  className="text-[10px] text-[#00F2FE] hover:underline font-bold"
                >
                  View all Feed &rarr;
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {issues.slice(0, 4).map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className="cursor-pointer p-4 rounded-xl bg-surface shadow-sm shadow-sm/40 border border-border-subtle hover:border-border-subtle hover:border-foreground/20 transition flex items-start gap-4 hover-lift"
                  >
                    {issue.initialImageUrl ? (
                      <img
                        src={issue.initialImageUrl}
                        alt={issue.title}
                        className="w-16 h-16 rounded-lg object-cover border border-border-subtle shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center text-slate-600 border border-border-subtle shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-bold text-[#00F2FE] font-mono">{issue.id}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            issue.severity === "Critical"
                              ? "bg-rose-950/40 text-rose-400 border-rose-800 animate-pulse"
                              : issue.severity === "High"
                              ? "bg-orange-950/40 text-orange-400 border-orange-850"
                              : "bg-indigo-950/40 text-[#6366F1] border-indigo-900"
                          }`}
                        >
                          {issue.severity}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground truncate">{issue.title}</h4>
                      <p className="text-[10px] text-foreground/60 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#00F2FE] shrink-0" />
                        {issue.address}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </div>
      )}

      {/* TAB 2: REPORT AN ISSUE WORKFLOW */}
      {activeTab === "report" && (
        <div className="p-6 rounded-2xl bg-surface shadow-md shadow-md border border-border-subtle shadow-2xl space-y-6">
          {/* Workflow Header Steps */}
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Camera className="w-5 h-5 text-ashoka-navy dark:text-ashoka-navy" />
                Submit Civic Defect Report
              </h2>
              <p className="text-xs text-foreground/60">Step {reportStep === "media" ? "1" : "2"} of 2: Visual Capture & AI Verification</p>
            </div>
            <button
              onClick={() => setActiveTab("home")}
              className="text-xs text-foreground/60 hover:text-foreground px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-background transition"
            >{t('Cancel')}</button>
          </div>

          {/* STEP A: MEDIA & LOCATION CAPTURE */}
          {reportStep === "media" && (
            <div className="space-y-6">
              {/* Photo Capture Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  1. Capture or Upload Defect Photo
                </label>

                {/* Drag & Drop Upload Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processFile(file);
                  }}
                  className={`group cursor-pointer border-2 border-dashed rounded-2xl p-8 bg-background/60 transition text-center space-y-3 ${
                    isDraggingOver
                      ? "border-saffron bg-saffron/5"
                      : "border-border-subtle hover:border-foreground/20 hover:border-saffron hover:bg-background"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    style={{ display: 'none' }}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-saffron/10 border border-saffron/30 flex items-center justify-center text-ashoka-navy dark:text-ashoka-navy mx-auto group-hover:scale-110 transition pointer-events-none">
                    {isVerifyingImage ? (
                      <RefreshCw className="w-7 h-7 animate-spin" />
                    ) : (
                      <Camera className="w-7 h-7" />
                    )}
                  </div>
                  <div className="pointer-events-none">
                    <p className="text-sm font-semibold text-foreground">
                      {isVerifyingImage ? "Verifying image integrity..." : "Click to Take Camera Photo or Upload File"}
                    </p>
                    <p className="text-xs text-foreground/60 mt-1">Supports High-Resolution JPEG, PNG, WEBP, HEIC</p>
                  </div>
                </div>

                {/* AI Verification Badge */}
                {aiVerification?.valid && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="font-bold">✓ AI Verified Real Photo ({aiVerification.confidenceScore}% Confidence)</p>
                      <p className="text-[10px] text-emerald-400/80 mt-0.5">
                        Predicted Category: {aiVerification.categoryPrediction}
                        {aiVerification.exifTags?.lat && " | GPS Extracted"}
                      </p>
                    </div>
                  </div>
                )}

                {imageValidationError && (
                  <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-400 flex items-center gap-2" role="alert">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {imageValidationError}
                  </p>
                )}

                {/* Quick Presets for Demo */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] text-foreground/60 font-medium">Or select a high-resolution simulation sample:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DEMO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setIssueAddress(preset.address);
                          setIssueLatitude(preset.lat);
                          setIssueLongitude(preset.lng);
                          setAiVerification({
                            valid: true,
                            categoryPrediction: preset.category,
                            confidenceScore: 99,
                            generativeScore: 0.01,
                            exifTags: { lat: preset.lat, lng: preset.lng }
                          });
                          setIsVerifyingImage(false);
                          handleImageSelected(preset.url, preset.description);
                        }}
                        className="p-2 rounded-xl bg-background border border-border-subtle hover:border-saffron/60 text-left transition group space-y-1"
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-14 object-cover rounded-lg group-hover:opacity-90"
                        />
                        <div className="text-[11px] font-semibold text-foreground/80 truncate">{preset.label}</div>
                        <div className="text-[9px] text-ashoka-navy dark:text-ashoka-navy truncate">{preset.category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location Selector */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    2. Location & GPS Geo-Lock
                  </label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="text-xs font-semibold text-ashoka-navy dark:text-ashoka-navy hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-saffron/80 transition"
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
                  className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-saffron"
                />

                {/* Map Pin Adjuster */}
                <div className="h-44 rounded-xl overflow-hidden border border-border-subtle">
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
                <div className="md:col-span-1 rounded-2xl overflow-hidden border border-border-subtle bg-background h-56 relative">
                  {capturedImage && (
                    <img src={capturedImage} alt="Captured defect" className="w-full h-full object-cover" />
                  )}
                  {isAnalyzingImage && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-2">
                      <Sparkles className="w-8 h-8 text-ashoka-navy dark:text-ashoka-navy animate-spin" />
                      <p className="text-xs font-bold text-foreground">Gemini 3.7 Vision Analyzing...</p>
                      <p className="text-[10px] text-foreground/60">Classifying severity, hazards & routing</p>
                    </div>
                  )}
                </div>

                {/* AI Classification Insights */}
                <div className="md:col-span-2 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      AI Visual Triage
                    </span>
                    {aiAnalysis && (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                        aiAnalysis.verificationStatus === "verified" && aiAnalysis.isValidScene && aiAnalysis.hasVisibleIssue && !aiAnalysis.isCategoryMismatch
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-700"
                          : aiAnalysis.verificationStatus === "needs_review" || aiAnalysis.isCategoryMismatch || !aiAnalysis.isValidScene || !aiAnalysis.hasVisibleIssue || aiAnalysis.verificationStatus === "no_issue_detected"
                            ? "bg-amber-950/60 text-amber-300 border-amber-700"
                            : "bg-red-950/60 text-red-300 border-red-700"
                      }`}>
                        {aiAnalysis.verificationStatus === "verified" && aiAnalysis.isValidScene && aiAnalysis.hasVisibleIssue && !aiAnalysis.isCategoryMismatch && (
                          <><CheckCircle2 className="w-3 h-3" /> Issue Verified</>
                        )}
                        {(aiAnalysis.verificationStatus === "needs_review" || aiAnalysis.isCategoryMismatch) && (
                          <><AlertTriangle className="w-3 h-3" /> Needs Review</>
                        )}
                        {(!aiAnalysis.isValidScene || !aiAnalysis.hasVisibleIssue || aiAnalysis.verificationStatus === "no_issue_detected") && (
                          <><HelpCircle className="w-3 h-3" /> Triage Inconclusive</>
                        )}
                      </span>
                    )}
                  </div>

                  {aiAnalysis && !aiAnalysis.isValidScene && (
                    <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-amber-200">
                        <strong className="text-amber-500 block mb-1">Scene Warning</strong>
                        This does not appear to be a standard public infrastructure scene. You may still submit the report, but it will require manual review.
                      </p>
                    </div>
                  )}

                  {aiAnalysis && !aiAnalysis.isAuthentic && aiAnalysis.isValidScene && (
                    <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-amber-200">
                        <strong className="text-amber-500 block mb-1">Source Warning</strong>
                        This photo appears to be a screenshot or web-downloaded image. You may still submit the report, but it will be flagged for manual review.
                        {aiAnalysis.authenticityReasoning && (
                          <span className="block mt-1 opacity-80 text-xs font-mono">{aiAnalysis.authenticityReasoning}</span>
                        )}
                      </p>
                    </div>
                  )}

                  {aiAnalysis && aiAnalysis.isValidScene && !aiAnalysis.hasVisibleIssue && (
                    <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-amber-200">
                        <strong className="text-amber-400 block mb-1">No Visible Issue</strong>
                        We could not visually confirm a civic issue in this scene. 
                        Please ensure the defect is clearly visible, or provide more context in the description.
                      </p>
                    </div>
                  )}

                  {aiAnalysis && aiAnalysis.isValidScene && aiAnalysis.hasVisibleIssue && aiAnalysis.isCategoryMismatch && (
                    <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs font-medium text-indigo-200">
                        <strong className="text-indigo-400 block mb-1">Category Mismatch</strong>
                        You selected <strong>{issueCategory}</strong>, but our AI detected <strong>{aiAnalysis.primaryIssueDetected}</strong>.
                        <div className="mt-2 flex gap-2">
                          <button type="button" onClick={() => setIssueCategory(aiAnalysis.predictedCategory)} className="px-2 py-1 bg-ashoka-navy hover:bg-ashoka-navy/100 text-foreground rounded text-[10px] font-bold">Use AI Category</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-surface/80 dark:bg-slate-100/80 dark:border-white/10 rounded-xl border border-border-subtle">
                      <span className="text-[10px] text-foreground/60 uppercase font-medium">Assigned Category</span>
                      <p className="text-xs font-bold text-foreground mt-0.5 truncate">{issueCategory}</p>
                    </div>
                    <div className="p-2.5 bg-surface/80 dark:bg-slate-100/80 dark:border-white/10 rounded-xl border border-border-subtle">
                      <span className="text-[10px] text-foreground/60 uppercase font-medium">Computed Severity</span>
                      <p className="text-xs font-bold text-rose-400 mt-0.5">{severity} Urgency</p>
                    </div>
                  </div>

                  {/* AI Confidence as supporting metadata — not headline truth */}
                  {aiAnalysis && aiAnalysis.confidence > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-foreground/60 font-medium">AI Confidence:</span>
                      <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            aiAnalysis.confidence >= 0.7
                              ? "bg-india-green"
                              : aiAnalysis.confidence >= 0.4
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${Math.round(aiAnalysis.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-foreground/60">
                        {Math.round(aiAnalysis.confidence * 100)}%
                      </span>
                    </div>
                  )}

                </div>
              </div>

              {/* Editable Form Details */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">Report Title</label>
                  <input
                    type="text"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-saffron"
                    placeholder="e.g. Deep Pothole on Market St"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80">Category Override</label>
                    <select
                      value={issueCategory}
                      onChange={(e) => setIssueCategory(e.target.value)}
                      className="w-full bg-background border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-saffron"
                    >
                      <option value="">Select a category</option>
                      <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                      <option value="Water & Sewage">Water & Sewage</option>
                      <option value="Electrical & Lighting">Electrical & Lighting</option>
                      <option value="Sanitation & Waste">Sanitation & Waste</option>
                      <option value="Parks & Public Spaces">Parks & Public Spaces</option>
                      <option value="Public Safety & Encroachment">Public Safety & Encroachment</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80">Severity Rating</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as Severity)}
                      className="w-full bg-background border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-saffron"
                    >
                      <option value="">Select severity</option>
                      <option value="Critical">Critical (Immediate hazard)</option>
                      <option value="High">High (High safety impact)</option>
                      <option value="Medium">Medium (General repair)</option>
                      <option value="Low">Low (Minor cosmetic)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">Additional Field Notes / Description</label>
                  <VoiceField
                    rows={3}
                    value={issueDescription}
                    onChange={setIssueDescription}
                    placeholder="Provide any specific details regarding damage, nearby hazards, or vehicle impacts..."
                    className="w-full bg-background border border-border-subtle rounded-xl p-3.5 text-xs text-foreground focus:outline-none focus:border-saffron"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 py-3 border-t border-border-subtle mt-4">
                <input
                  type="checkbox"
                  id="anonymous-toggle"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded text-saffron bg-background border-border-subtle"
                />
                <label htmlFor="anonymous-toggle" className="text-xs font-semibold text-foreground/80 cursor-pointer select-none">
                  Submit Anonymously
                </label>
              </div>

              <input
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute left-[-10000px] h-px w-px opacity-0"
                defaultValue=""
              />
              {submissionError && <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200" role="alert">
                {submissionError}
              </div>}
              <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setReportStep("media")}
                  className="text-xs font-semibold text-foreground/60 hover:text-foreground px-4 py-2.5 rounded-xl border border-border-subtle transition"
                >
                  &larr; Re-take Photo
                </button>
                <button
                  type="button"
                  onClick={handleInitiateSubmission}
                  disabled={isCheckingDuplicates || isSubmittingReport}
                  className="px-6 py-2.5 rounded-xl bg-saffron hover:bg-saffron/90 text-foreground font-bold text-xs shadow-lg shadow-cyan-600/30 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingDuplicates || isSubmittingReport ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Checking Duplicates...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Submit Final Report
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* DUPLICATE PREVENTION INTERCEPT MODAL */}
          {reportStep === "duplicate_modal" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-200">Potential Duplicate Issues Detected</h4>
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    Our spatial AI found existing reports near this location for "{issueCategory}". Upvoting existing reports helps municipal teams prioritize dispatch.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Nearby Active Reports:</span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {duplicateMatches.map((match) => (
                    <div
                      key={match.issue.id}
                      className="p-3.5 rounded-xl bg-background border border-border-subtle hover:border-border-subtle hover:border-foreground/20 transition flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-ashoka-navy dark:text-ashoka-navy font-bold">{match.issue.id}</span>
                          <span className="text-[10px] text-foreground/60 font-medium">({match.distanceMeters.toFixed(0)}m away)</span>
                        </div>
                        <h5 className="text-xs font-bold text-foreground truncate">{match.issue.title}</h5>
                        <p className="text-[11px] text-foreground/60 truncate">{match.issue.address}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConfirmDuplicateUpvote(match.issue.id)}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600/25 hover:bg-emerald-600 text-india-green hover:text-foreground border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        +1 Confirm
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setReportStep("ai_verify")}
                  className="text-xs font-semibold text-foreground/60 hover:text-foreground"
                >
                  &larr; Back to Edit
                </button>
                <button
                  type="button"
                  onClick={executeFinalSubmission}
                  disabled={isSubmittingReport}
                  className="px-5 py-2.5 rounded-xl bg-background hover:bg-slate-100 text-foreground/80 font-bold text-xs border border-border-subtle hover:border-foreground/20 transition"
                >
                  {isSubmittingReport ? "Submitting..." : "No, My Issue is Distinct & Separate"}
                </button>
              </div>
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {reportStep === "success" && (
            <SubmissionSuccessModal
              trackingId={createdIssueId}
              category={issueCategory}
              locationName={issueAddress || `Lat: ${issueLatitude.toFixed(4)}, Lng: ${issueLongitude.toFixed(4)}`}
              onTrackComplaint={() => setActiveTab("my-reports")}
              onReportAnother={() => {
                setReportStep("media");
                setCapturedImage(null);
                setIssueTitle("");
                setIssueDescription("");
              }}
            />
          )}
        </div>
      )}

      {/* TAB 3: MY REPORTS LIST */}
      {activeTab === "my-reports" && (() => {
        const total = myReportsList.length;
        const inProgress = myReportsList.filter(r => r.status === "in_progress").length;
        const resolved = myReportsList.filter(r => r.status === "resolved").length;
        // Simple overdue calculation for demo
        const overdue = myReportsList.filter(r => r.status === "in_progress").filter(r => {
          if (!r.deadlineAt) return false;
          return new Date(r.deadlineAt) < new Date();
        }).length;

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-surface border border-border-subtle rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{total}</span>
                <span className="text-[10px] text-foreground/60 font-bold uppercase tracking-wider mt-1">Total</span>
              </div>
              <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-blue-400">{inProgress}</span>
                <span className="text-[10px] text-blue-400/80 font-bold uppercase tracking-wider mt-1">{t('In Progress')}</span>
              </div>
              <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-india-green">{resolved}</span>
                <span className="text-[10px] text-india-green/80 font-bold uppercase tracking-wider mt-1">{t('Resolved')}</span>
              </div>
              <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-red-400">{overdue}</span>
                <span className="text-[10px] text-red-400/80 font-bold uppercase tracking-wider mt-1">Overdue</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground/80">My Submitted Incident History</h3>
              <span className="text-xs text-foreground/60">{total} Reports</span>
            </div>

          {myReportsList.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface shadow-md shadow-md border border-border-subtle text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-foreground/60">You haven't filed any public municipal reports yet.</p>
              <button
                onClick={() => {
                  setActiveTab("report");
                  setReportStep("media");
                }}
                className="px-4 py-2 rounded-xl bg-saffron text-foreground text-xs font-bold hover:bg-saffron/90 transition inline-block"
              >
                File Your First Report
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myReportsList.map((issue) => {
                const createdAtDate = new Date(issue.createdAt);
                const statutoryDeadline = new Date(createdAtDate.getTime() + 21 * 24 * 60 * 60 * 1000);
                const remainingDays = Math.max(0, Math.ceil((statutoryDeadline.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
                const isResolved = issue.status === "resolved";
                
                return (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  className="cursor-pointer p-4 rounded-2xl bg-surface shadow-md border border-border-subtle hover:border-foreground/20 transition flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {issue.initialImageUrl ? (
                        <img
                          src={issue.initialImageUrl}
                          alt={issue.title}
                          className="w-14 h-14 rounded-xl object-cover border border-border-subtle shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center text-foreground/60 shrink-0">
                          <Camera className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-ashoka-navy dark:text-ashoka-navy font-bold">{issue.id}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-background text-foreground/80 border border-border-subtle">
                            {issue.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground truncate">{issue.title}</h4>
                        <p className="text-[11px] text-foreground/60 truncate">{issue.address}</p>
                      </div>
                    </div>
                    {!isResolved && (
                      <div className="shrink-0 text-right">
                        <div className="text-[10px] uppercase font-bold text-foreground/60 tracking-wider">Statutory Limit</div>
                        <div className={`text-sm font-bold ${remainingDays < 5 ? "text-red-500" : "text-amber-500"}`}>
                          {remainingDays} Days Left
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Status Tracker */}
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-border-subtle/50 text-[9px] font-bold uppercase tracking-wider text-foreground/40">
                    <span className={issue.status === "submitted" || issue.status === "in_progress" || isResolved || issue.status === "escalated" ? "text-blue-500" : ""}>Submitted</span>
                    <span className="flex-1 h-px bg-border-subtle mx-2" />
                    <span className={issue.status === "in_progress" || isResolved || issue.status === "escalated" ? "text-amber-500" : ""}>In Progress</span>
                    <span className="flex-1 h-px bg-border-subtle mx-2" />
                    <span className={isResolved ? "text-india-green" : ""}>Resolved</span>
                    <span className="flex-1 h-px bg-border-subtle mx-2" />
                    <span className={issue.status === "escalated" ? "text-red-500" : ""}>Escalated</span>
                  </div>
                </div>
              )})}
            </div>
          )}
          </div>
        );
      })()}

      {/* TAB 4: LIVE CITY FEED */}
      {activeTab === "feed" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground/80">Real-Time Citywide Incident Stream</h3>
            <span className="text-xs text-foreground/60">Sorted by active status and community support</span>
          </div>

          <div className="space-y-3">
            {issues.map((issue) => {
              const createdAtDate = new Date(issue.createdAt);
              const statutoryDeadline = new Date(createdAtDate.getTime() + 21 * 24 * 60 * 60 * 1000);
              const remainingDays = Math.max(0, Math.ceil((statutoryDeadline.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
              const isResolved = issue.status === "resolved";
              
              return (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className="cursor-pointer p-4 rounded-2xl bg-surface shadow-md border border-border-subtle hover:border-foreground/20 transition flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {issue.initialImageUrl ? (
                      <img
                        src={issue.initialImageUrl}
                        alt={issue.title}
                        className="w-16 h-16 rounded-xl object-cover border border-border-subtle shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-background flex items-center justify-center text-foreground/60 shrink-0">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-ashoka-navy dark:text-ashoka-navy font-bold">{issue.id}</span>
                        <span className="text-[10px] text-foreground/60">• {issue.category}</span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground truncate">{issue.title}</h4>
                      <p className="text-[11px] text-foreground/60 truncate">{issue.address}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    {!isResolved && (
                      <div className={`text-[10px] font-bold ${remainingDays < 5 ? "text-red-500" : "text-amber-500"}`}>
                        {remainingDays} Days Left
                      </div>
                    )}
                    <span className="text-[10px] text-ashoka-navy dark:text-ashoka-navy font-mono block">
                      Upvotes: {issue.upvotesCount}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-background text-foreground/80 border border-border-subtle hover:border-foreground/20">
                      {issue.status}
                    </span>
                  </div>
                </div>
                
                {/* Status Tracker */}
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-border-subtle/50 text-[9px] font-bold uppercase tracking-wider text-foreground/40">
                  <span className={issue.status === "submitted" || issue.status === "in_progress" || isResolved || issue.status === "escalated" ? "text-blue-500" : ""}>Submitted</span>
                  <span className="flex-1 h-px bg-border-subtle mx-2" />
                  <span className={issue.status === "in_progress" || isResolved || issue.status === "escalated" ? "text-amber-500" : ""}>In Progress</span>
                  <span className="flex-1 h-px bg-border-subtle mx-2" />
                  <span className={isResolved ? "text-india-green" : ""}>Resolved</span>
                  <span className="flex-1 h-px bg-border-subtle mx-2" />
                  <span className={issue.status === "escalated" ? "text-red-500" : ""}>Escalated</span>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}
    </div>);
}
