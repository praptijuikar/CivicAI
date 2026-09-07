import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
import {
  ShieldAlert,
  Shield,
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  AlertTriangle,
  FileText,
  Upload,
  Fingerprint,
  PhoneCall,
  ExternalLink,
  CheckCircle2,
  Copy,
  Printer,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Search,
  Clock,
  HelpCircle,
  FileCheck,
  RefreshCw,
  LogOut,
  X,
  ChevronRight,
  ChevronDown,
  Info,
  Scale,
  Send,
  SlidersHorizontal,
  Flame,
  KeyRound,
  FileCode,
  Download,
} from "lucide-react";
import { api } from "../lib/api";
import { STATUTE_CATALOG } from "../../server/threatPipeline";
import type {
  User,
  Language,
  ThreatCategory,
  ThreatPlatform,
  ThreatEvidenceFile,
  CyberThreatReport,
  LegalStatute,
  ThreatSubmissionPayload,
  LegalComplaintDossier,
} from "../types";

interface CyberThreatPortalProps {
  currentUser: User;
  language: Language;
  onNavigateHome?: () => void;
}

// Quick Sample Templates for Easy Demo / Quick Ingestion
const QUICK_TEMPLATES = [
  {
    title: "Instagram Sextortion & UPI Blackmail",
    category: "EXTORTION_SEXTORTION" as ThreatCategory,
    platform: "INSTAGRAM" as ThreatPlatform,
    suspectHandle: "@blackmail_bot_66",
    suspectUrl: "https://instagram.com/blackmail_bot_66",
    narrative:
      "Perpetrator direct-messaged claiming to possess private pictures from my device. Demanding ₹50,000 via UPI ID within 8 hours or threatens to circulate files to my university alumni group.",
  },
  {
    title: "X/Twitter Physical Threat & Doxxing",
    category: "EXPLICIT_THREATS" as ThreatCategory,
    platform: "TWITTER_X" as ThreatPlatform,
    suspectHandle: "@harasser_swarms_x",
    suspectUrl: "https://x.com/harasser_swarms_x",
    narrative:
      "Accused posted public threats stating 'We know your daily commute route, expect consequences tonight' accompanied by a photo of my apartment building entrance.",
  },
  {
    title: "WhatsApp Identity Impersonation & Fraud",
    category: "IMPERSONATION" as ThreatCategory,
    platform: "WHATSAPP" as ThreatPlatform,
    suspectHandle: "+91-98441-29100",
    suspectUrl: "https://wa.me/919844129100",
    narrative:
      "Perpetrator cloned my profile picture and name, messaging my contacts requesting urgent ₹25,000 emergency medical funds.",
  },
];

export default function CyberThreatPortal({ currentUser, language, onNavigateHome }: CyberThreatPortalProps) {
  const { t } = useTranslation();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"wizard" | "records" | "statutes">("wizard");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [name, setName] = useState(currentUser.role !== "citizen" ? "" : currentUser.name || "Jane Doe");
  const [email, setEmail] = useState(currentUser.email || "jane.doe@example.com");
  const [phone, setPhone] = useState(currentUser.phone || "+91 98765 43210");
  const [preferredContact, setPreferredContact] = useState<"EMAIL" | "PHONE" | "SECURE_IN_APP">("EMAIL");
  const [safeCallbackHours, setSafeCallbackHours] = useState("10:00 AM - 6:00 PM IST");

  // Step 2 State
  const [platform, setPlatform] = useState<ThreatPlatform>("INSTAGRAM");
  const [suspectHandle, setSuspectHandle] = useState("@blackmail_account");
  const [suspectProfileUrl, setSuspectProfileUrl] = useState("https://instagram.com/blackmail_account");
  const [suspectContactInfo, setSuspectContactInfo] = useState("");
  const [incidentTimestamp, setIncidentTimestamp] = useState(() => new Date().toISOString().slice(0, 16));
  const [repeatOffender, setRepeatOffender] = useState(false);

  // Step 3 State
  const [threatCategory, setThreatCategory] = useState<ThreatCategory>("EXTORTION_SEXTORTION");
  const [narrative, setNarrative] = useState(
    "Received direct messages threatening to publish private photos unless money is sent within 12 hours."
  );

  // Step 4 State (Evidence Vault)
  const [evidenceFiles, setEvidenceFiles] = useState<ThreatEvidenceFile[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isHashing, setIsHashing] = useState(false);
  const [hashProgress, setHashProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Urgency Modal State
  const [showUrgencyModal, setShowUrgencyModal] = useState(false);
  const [hasAcknowledgedUrgency, setHasAcknowledgedUrgency] = useState(false);

  // Submission & Dossier State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<CyberThreatReport | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Records View State
  const [records, setRecords] = useState<CyberThreatReport[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [recordSearch, setRecordSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<CyberThreatReport | null>(null);

  // Quick Safety Exit trigger on 'Escape' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        quickSafetyExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const quickSafetyExit = () => {
    // Overwrite local memory and redirect instantly to neutral public site
    sessionStorage.clear();
    window.location.replace("https://www.google.com/search?q=weather+today");
  };

  // Check if current category or narrative warrants Urgency Popup
  useEffect(() => {
    const highRisk =
      threatCategory === "EXTORTION_SEXTORTION" ||
      threatCategory === "EXPLICIT_THREATS" ||
      threatCategory === "NON_CONSENSUAL_IMAGERY";
    if (highRisk && !hasAcknowledgedUrgency && currentStep === 3) {
      setShowUrgencyModal(true);
    }
  }, [threatCategory, hasAcknowledgedUrgency, currentStep]);

  // Fetch threat records
  const loadRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const res = await api.getThreatReports();
      setRecords(res.reports || []);
    } catch (err) {
      console.error("Failed to load threat reports", err);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  useEffect(() => {
    if (activeTab === "records") {
      loadRecords();
    }
  }, [activeTab]);

  // Client-side SHA-256 Web Crypto calculation
  async function computeSha256(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Convert File to Base64
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Handle Evidence Files Selected
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsHashing(true);
    setHashProgress(10);

    const newEvidence: ThreatEvidenceFile[] = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      setHashProgress(Math.round(((i + 0.3) / total) * 100));

      const hash = await computeSha256(file);
      let base64Data: string | undefined;
      if (file.type.startsWith("image/") && file.size < 8 * 1024 * 1024) {
        try {
          base64Data = await fileToBase64(file);
        } catch (e) {
          console.warn("Base64 read failed", e);
        }
      }

      setHashProgress(Math.round(((i + 1) / total) * 100));

      newEvidence.push({
        id: `ev-${Date.now()}-${i}`,
        fileName: file.name,
        fileHash: hash,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        fileSizeFormatted: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        fileData: base64Data,
        extractedText: file.name.endsWith(".txt") ? "Chat export text payload" : undefined,
      });
    }

    setEvidenceFiles((prev) => [...prev, ...newEvidence]);
    setIsHashing(false);
    setHashProgress(100);
  };

  const removeEvidence = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const printDossier = () => {
    window.print();
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: ThreatSubmissionPayload = {
        isAnonymous,
        complainantContact: isAnonymous
          ? undefined
          : {
              name: name.trim() || "Confidential Complainant",
              email: email.trim(),
              phone: phone.trim(),
              preferredContact,
              safeCallbackHours,
            },
        threatCategory,
        incidentMeta: {
          platform,
          suspectHandle: suspectHandle.trim(),
          suspectProfileUrl: suspectProfileUrl.trim(),
          suspectContactInfo: suspectContactInfo.trim() || undefined,
          incidentTimestamp: new Date(incidentTimestamp).toISOString(),
          narrative: narrative.trim(),
          repeatOffender,
        },
        evidenceFiles:
          evidenceFiles.length > 0
            ? evidenceFiles
            : [
                {
                  fileName: "incident_declaration_hash.txt",
                  fileHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                  mimeType: "text/plain",
                  fileSize: 1024,
                  fileSizeFormatted: "1 KB",
                },
              ],
      };

      const res = await api.submitThreatReport(payload);
      setSubmittedReport(res.report);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#00F2FE", "#6366F1", "#10B981"],
      });
    } catch (err: any) {
      alert(`Submission failed: ${err.message || "Network error. Please try again."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyQuickTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setThreatCategory(tpl.category);
    setPlatform(tpl.platform);
    setSuspectHandle(tpl.suspectHandle);
    setSuspectProfileUrl(tpl.suspectUrl);
    setNarrative(tpl.narrative);
  };

  const resetForm = () => {
    setSubmittedReport(null);
    setCurrentStep(1);
    setEvidenceFiles([]);
    setHasAcknowledgedUrgency(false);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans pb-24 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[350px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[300px] bg-rose-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Emergency Safety Banner & Quick Exit */}
      <div className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-rose-500/30 px-4 py-2.5 flex items-center justify-between shadow-2xl shadow-rose-950/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Cyber Threat Shield</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-300 font-medium">
            <span>Immediate crisis or extortion?</span>
            <a
              href="tel:1930"
              className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-bold bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/40 transition"
            >
              <PhoneCall className="w-3 h-3 text-amber-400" />
              <span>Dial 1930 (Cyber Helpline)</span>
            </a>
            <a
              href="tel:112"
              className="inline-flex items-center gap-1.5 text-rose-300 hover:text-rose-200 font-bold bg-rose-500/20 px-2.5 py-0.5 rounded-lg border border-rose-500/40 transition"
            >
              <PhoneCall className="w-3 h-3 text-rose-400" />
              <span>112 Emergency</span>
            </a>
          </div>
        </div>

        {/* Quick Safety Exit Button */}
        <button
          onClick={quickSafetyExit}
          title="Instantly clears page and redirects to neutral search (Shortcut: ESC)"
          className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 border border-rose-400/40 cursor-pointer transition active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Quick Safety Exit</span>
          <kbd className="hidden md:inline-block text-[9px] bg-black/40 px-1.5 py-0.5 rounded font-mono border border-white/20">
            ESC
          </kbd>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider uppercase mb-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Forensic Proof Engine • IT Act & IPC Legal Mapping</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Online Threat & Cyber Harassment Vault</span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono">
                SHA-256 SEALED
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Confidential, tamper-proof reporting for cyberstalking, extortion, doxxing, and digital harassment with
              instant evidence OCR, AI severity scoring, and legal First Information Report (FIR) dossier creation.
            </p>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex items-center p-1 bg-slate-900/80 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-xl self-start md:self-auto">
            <button
              onClick={() => {
                setActiveTab("wizard");
                if (submittedReport) setSubmittedReport(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "wizard"
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>File Complaint</span>
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "records"
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Threat Vault Records</span>
            </button>
            <button
              onClick={() => setActiveTab("statutes")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "statutes"
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Legal Statutes</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: 4-STEP WIZARD / DOSSIER OUTPUT */}
        {/* ========================================================================= */}
        {activeTab === "wizard" && (
          <div>
            {!submittedReport ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Wizard Form Column */}
                <div className="lg:col-span-8">
                  {/* Step Tracker */}
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-6 backdrop-blur-md">
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {[
                        { num: 1, label: "Identity & Safety", icon: Shield },
                        { num: 2, label: "Platform & Accused", icon: UserCheck },
                        { num: 3, label: "Classification", icon: AlertTriangle },
                        { num: 4, label: "Evidence Vault", icon: Fingerprint },
                      ].map((step) => {
                        const Icon = step.icon;
                        const isCurrent = currentStep === step.num;
                        const isCompleted = currentStep > step.num;
                        return (
                          <button
                            key={step.num}
                            onClick={() => setCurrentStep(step.num as any)}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-2 px-1 rounded-xl transition border cursor-pointer ${
                              isCurrent
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20 font-bold"
                                : isCompleted
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                : "bg-transparent text-slate-500 border-transparent hover:text-slate-300"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                                isCurrent
                                  ? "bg-cyan-500 text-slate-950"
                                  : isCompleted
                                  ? "bg-emerald-500 text-slate-950"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.num}
                            </div>
                            <span className="hidden sm:inline text-xs">{step.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Container with Glassmorphism */}
                  <div className="bg-gradient-to-b from-slate-900/90 to-[#0c101c]/90 border border-slate-700/60 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60 relative">
                    <form onSubmit={handleSubmit}>
                      {/* ------------------------------------------------------------- */}
                      {/* STEP 1: IDENTITY & SAFETY PREFERENCES */}
                      {/* ------------------------------------------------------------- */}
                      {currentStep === 1 && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div>
                              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-cyan-400" />
                                <span>Step 1: Complainant Identity & Safety Shield</span>
                              </h2>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Choose between a confidential protected report or verified identified legal submission.
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                              <Lock className="w-3 h-3" />
                              <span>256-bit Encrypted</span>
                            </div>
                          </div>

                          {/* Anonymous Toggle Card */}
                          <div
                            onClick={() => setIsAnonymous(!isAnonymous)}
                            className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                              isAnonymous
                                ? "bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-900/20"
                                : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  isAnonymous ? "bg-cyan-500 text-slate-950 font-black" : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                <EyeOff className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                  <span>Submit as Anonymous / Confidential Whistleblower</span>
                                  {isAnonymous && (
                                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.2 rounded-full border border-cyan-500/40 uppercase font-mono">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Your name and contact details will NOT be shared with public registries or platform intermediaries.
                                </p>
                              </div>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                                isAnonymous ? "border-cyan-400 bg-cyan-500 text-slate-950" : "border-slate-700 bg-slate-800"
                              }`}
                            >
                              {isAnonymous && <CheckCircle2 className="w-4 h-4" />}
                            </div>
                          </div>

                          {/* Contact Info (if not anonymous) */}
                          {!isAnonymous && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                  Complainant Legal Name *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  placeholder="Full legal name"
                                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                  Verified Mobile / WhatsApp *
                                </label>
                                <input
                                  type="tel"
                                  required
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="+91 98765 43210"
                                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                  Official Email Address *
                                </label>
                                <input
                                  type="email"
                                  required
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="jane@example.com"
                                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                  Preferred Contact Mode
                                </label>
                                <select
                                  value={preferredContact}
                                  onChange={(e) => setPreferredContact(e.target.value as any)}
                                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                                >
                                  <option value="EMAIL">Email (Encrypted updates)</option>
                                  <option value="PHONE">Phone / WhatsApp Call</option>
                                  <option value="SECURE_IN_APP">In-App Secure Vault Only</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                  Safe Callback Hours
                                </label>
                                <input
                                  type="text"
                                  value={safeCallbackHours}
                                  onChange={(e) => setSafeCallbackHours(e.target.value)}
                                  placeholder="e.g. 10:00 AM - 1:00 PM IST"
                                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                                />
                              </div>
                            </div>
                          )}

                          {/* Navigation Buttons */}
                          <div className="flex justify-end pt-4 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                            >
                              <span>Next: Platform & Perpetrator</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ------------------------------------------------------------- */}
                      {/* STEP 2: PLATFORM & PERPETRATOR DETAILS */}
                      {/* ------------------------------------------------------------- */}
                      {currentStep === 2 && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div>
                              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-indigo-400" />
                                <span>Step 2: Platform & Perpetrator Identifiers</span>
                              </h2>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Specify where the abuse occurred and any known perpetrator handles or URLs.
                              </p>
                            </div>
                          </div>

                          {/* Platform Selector Grid */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2">
                              Select Incident Platform *
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                              {[
                                { id: "INSTAGRAM", name: "Instagram", color: "from-pink-500 to-rose-600" },
                                { id: "WHATSAPP", name: "WhatsApp", color: "from-emerald-500 to-green-600" },
                                { id: "TWITTER_X", name: "X / Twitter", color: "from-slate-700 to-slate-900" },
                                { id: "TELEGRAM", name: "Telegram", color: "from-sky-500 to-blue-600" },
                                { id: "DARK_WEB", name: "Dark Web Forum", color: "from-purple-900 to-slate-950" },
                                { id: "DISCORD", name: "Discord", color: "from-indigo-600 to-indigo-800" },
                                { id: "REDDIT", name: "Reddit", color: "from-orange-500 to-red-600" },
                                { id: "OTHER", name: "Other / SMS / Call", color: "from-slate-600 to-slate-800" },
                              ].map((p) => {
                                const selected = platform === p.id;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setPlatform(p.id as ThreatPlatform)}
                                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                                      selected
                                        ? "bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-900/30 text-white"
                                        : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                                    }`}
                                  >
                                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${p.color}`} />
                                    <span>{p.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Suspect Handle / Username *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm font-mono">@</span>
                                <input
                                  type="text"
                                  required
                                  value={suspectHandle.replace(/^@/, "")}
                                  onChange={(e) => setSuspectHandle(`@${e.target.value.replace(/^@/, "")}`)}
                                  placeholder="blackmail_account"
                                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Suspect Profile URL / Channel Link
                              </label>
                              <input
                                type="url"
                                value={suspectProfileUrl}
                                onChange={(e) => setSuspectProfileUrl(e.target.value)}
                                placeholder="https://instagram.com/blackmail_account"
                                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Date & Time of Incident *
                              </label>
                              <input
                                type="datetime-local"
                                required
                                value={incidentTimestamp}
                                onChange={(e) => setIncidentTimestamp(e.target.value)}
                                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Known Phone / UPI ID / Payment Info
                              </label>
                              <input
                                type="text"
                                value={suspectContactInfo}
                                onChange={(e) => setSuspectContactInfo(e.target.value)}
                                placeholder="e.g. UPI: suspect@okhdfcbank"
                                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                              />
                            </div>
                          </div>

                          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={repeatOffender}
                              onChange={(e) => setRepeatOffender(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-slate-300">
                              This suspect is a repeat offender or has targeted multiple victims.
                            </span>
                          </label>

                          {/* Navigation Buttons */}
                          <div className="flex justify-between pt-4 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setCurrentStep(1)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              <span>Back</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(3)}
                              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                            >
                              <span>Next: Threat Classification</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ------------------------------------------------------------- */}
                      {/* STEP 3: THREAT CLASSIFICATION & NARRATIVE */}
                      {/* ------------------------------------------------------------- */}
                      {currentStep === 3 && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div>
                              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                                <span>Step 3: Threat Classification & Narrative Description</span>
                              </h2>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Select the core threat category to activate statutory mapping under the IT Act & IPC.
                              </p>
                            </div>
                          </div>

                          {/* Threat Categories Grid */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2">
                              Threat Category *
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {[
                                {
                                  id: "EXTORTION_SEXTORTION",
                                  title: "Extortion / Sextortion",
                                  desc: "Demand of money or crypto under threat of leaking private media.",
                                  risk: "CRITICAL RISK",
                                  badge: "IPC 384 / IT Act 66E",
                                },
                                {
                                  id: "EXPLICIT_THREATS",
                                  title: "Explicit Physical / Death Threats",
                                  desc: "Threats of physical harm, violence, murder, or bodily injury.",
                                  risk: "CRITICAL RISK",
                                  badge: "IPC 506 / BNS 351",
                                },
                                {
                                  id: "NON_CONSENSUAL_IMAGERY",
                                  title: "Non-Consensual Imagery / Deepfakes",
                                  desc: "Unauthorized circulation or deepfake synthesis of intimate media.",
                                  risk: "CRITICAL RISK",
                                  badge: "IT Act 66E / 67A",
                                },
                                {
                                  id: "DOXXING",
                                  title: "Doxxing & Personal Info Leak",
                                  desc: "Publishing residential home address, phone numbers, or employer details.",
                                  risk: "HIGH RISK",
                                  badge: "IPC 499 / IT Act 66E",
                                },
                                {
                                  id: "CYBERSTALKING",
                                  title: "Cyberstalking & Persistent Harassment",
                                  desc: "Continuous unwanted tracking, monitoring, or burner account swarming.",
                                  risk: "HIGH RISK",
                                  badge: "IPC 354D (BNS 78)",
                                },
                                {
                                  id: "IMPERSONATION",
                                  title: "Impersonation & Fake Profiles",
                                  desc: "Cloning identities or creating spoof profiles to defraud or defame.",
                                  risk: "MEDIUM RISK",
                                  badge: "IT Act 66D",
                                },
                              ].map((cat) => {
                                const isSelected = threatCategory === cat.id;
                                const isCritical = cat.risk === "CRITICAL RISK";
                                return (
                                  <div
                                    key={cat.id}
                                    onClick={() => setThreatCategory(cat.id as ThreatCategory)}
                                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                                      isSelected
                                        ? isCritical
                                          ? "bg-rose-950/40 border-rose-500/70 shadow-lg shadow-rose-950/30 text-white"
                                          : "bg-indigo-950/40 border-indigo-500/70 shadow-lg shadow-indigo-950/30 text-white"
                                        : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-black">{cat.title}</span>
                                        <span
                                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                            isCritical
                                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                              : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                                          }`}
                                        >
                                          {cat.risk}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-400 leading-snug">{cat.desc}</p>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                      <span>Statute: {cat.badge}</span>
                                      <div
                                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                          isSelected ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-slate-700"
                                        }`}
                                      >
                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Narrative Textarea */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-semibold text-slate-300">
                                Detailed Statement of Facts (Narrative) *
                              </label>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {narrative.length} / 10,000 chars
                              </span>
                            </div>
                            <textarea
                              rows={5}
                              required
                              value={narrative}
                              onChange={(e) => setNarrative(e.target.value)}
                              placeholder="Describe the exact sequence of events, messages received, demands made, timestamps, and emotional/financial distress caused..."
                              className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl p-3.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition leading-relaxed"
                            />
                          </div>

                          {/* Quick Preset Buttons */}
                          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-2xl">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                              ⚡ Quick Preset Scenarios (Click to auto-fill):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {QUICK_TEMPLATES.map((tpl, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => applyQuickTemplate(tpl)}
                                  className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-xl text-slate-300 transition cursor-pointer flex items-center gap-1.5"
                                >
                                  <Sparkles className="w-3 h-3 text-cyan-400" />
                                  <span>{tpl.title}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Navigation Buttons */}
                          <div className="flex justify-between pt-4 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              <span>Back</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(4)}
                              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                            >
                              <span>Next: Evidence Vault & Hashing</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ------------------------------------------------------------- */}
                      {/* STEP 4: EVIDENCE VAULT & LOCAL SHA-256 HASHING */}
                      {/* ------------------------------------------------------------- */}
                      {currentStep === 4 && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div>
                              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Fingerprint className="w-5 h-5 text-cyan-400" />
                                <span>Step 4: Evidence Vault & Local SHA-256 Hashing</span>
                              </h2>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Drag and drop screenshots, chat exports, or video screen recordings for instant cryptographic hashing.
                              </p>
                            </div>
                          </div>

                          {/* Drag & Drop Upload Zone */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDraggingOver(true);
                            }}
                            onDragLeave={() => setIsDraggingOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDraggingOver(false);
                              handleFilesSelected(e.dataTransfer.files);
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-3xl p-8 text-center transition cursor-pointer ${
                              isDraggingOver
                                ? "border-cyan-400 bg-cyan-950/30 scale-[1.01]"
                                : "border-slate-700/80 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-900/60"
                            }`}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              accept="image/*,video/*,text/plain,application/pdf"
                              onChange={(e) => handleFilesSelected(e.target.files)}
                              className="hidden"
                            />
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 text-cyan-400 shadow-lg shadow-cyan-500/10">
                              <Upload className="w-7 h-7" />
                            </div>
                            <h3 className="text-sm font-bold text-white">
                              Drop screenshot files, chat logs, or video recordings here
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Supports PNG, JPG, MP4, TXT, PDF up to 50 MB each. Instant client-side Web Crypto SHA-256 seal.
                            </p>
                          </div>

                          {/* Real-time Hash Progress Bar */}
                          {isHashing && (
                            <div className="p-4 bg-slate-900/80 border border-cyan-500/40 rounded-2xl">
                              <div className="flex items-center justify-between text-xs font-bold text-cyan-300 mb-1.5">
                                <span className="flex items-center gap-2">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Computing SHA-256 Digest in Browser...</span>
                                </span>
                                <span>{hashProgress}%</span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-2 transition-all duration-300"
                                  style={{ width: `${hashProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Evidence Files Preview List */}
                          {evidenceFiles.length > 0 && (
                            <div className="space-y-3">
                              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                                Ingested Evidence Artifacts ({evidenceFiles.length})
                              </span>
                              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                {evidenceFiles.map((file, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      {file.previewUrl ? (
                                        <img
                                          src={file.previewUrl}
                                          alt="Preview"
                                          className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                          <FileText className="w-5 h-5" />
                                        </div>
                                      )}
                                      <div className="overflow-hidden">
                                        <div className="font-bold text-white truncate max-w-[220px] sm:max-w-xs">
                                          {file.fileName}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                          <span>{file.fileSizeFormatted}</span>
                                          <span>•</span>
                                          <span className="text-cyan-400">
                                            SHA-256: {file.fileHash.slice(0, 16)}...
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeEvidence(idx)}
                                      className="p-2 text-slate-500 hover:text-rose-400 rounded-xl transition cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Chain-of-Custody Certification Notice */}
                          <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
                            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-white">
                                Admissibility Certification under Section 65B of Indian Evidence Act
                              </div>
                              <p className="text-slate-400 text-[11px] mt-0.5">
                                Digital artifacts submitted through this portal receive an immutable cryptographic time-stamp
                                and SHA-256 master digest preserving chain-of-custody for direct presentation to law enforcement.
                              </p>
                            </div>
                          </div>

                          {/* Submit Action */}
                          <div className="flex justify-between pt-4 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setCurrentStep(3)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              <span>Back</span>
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-600 hover:opacity-95 text-slate-950 font-black px-8 py-3 rounded-2xl shadow-xl shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50 text-sm active:scale-98"
                            >
                              {isSubmitting ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>Extracting OCR & Generating Legal Dossier...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  <span>Submit Threat Complaint & Generate Legal Dossier</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </form>
                  </div>
                </div>

                {/* Sidebar Guidance & Real-time Statutory Insights */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Emergency Preservations Card */}
                  <div className="bg-gradient-to-br from-rose-950/40 via-slate-900/60 to-slate-950/90 border border-rose-500/30 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
                    <div className="flex items-center gap-2.5 text-rose-300 font-bold text-sm mb-3">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Crisis Action Protocol</span>
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-black">•</span>
                        <span>
                          <strong>Do not delete chats:</strong> Uncropped screenshots with timestamps provide vital forensic evidence.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-black">•</span>
                        <span>
                          <strong>Do not pay ransom:</strong> Financial payments encourage repeat extortion demands.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-black">•</span>
                        <span>
                          <strong>Report to 1930:</strong> Financial frauds reported within 2 hours have 85% fund freeze success rate.
                        </span>
                      </li>
                    </ul>

                    <div className="mt-4 pt-4 border-t border-rose-500/20">
                      <a
                        href="tel:1930"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black py-2.5 rounded-xl text-xs shadow-lg shadow-rose-950/50 hover:opacity-95 transition"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Call 1930 Cyber Helpline Now</span>
                      </a>
                    </div>
                  </div>

                  {/* Legal Overview Card */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-3">
                      <Scale className="w-4 h-4" />
                      <span>Automatic Statutory Mapping</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      CivicAI parses narrative context and evidence OCR to recommend formal FIR sections under Indian Penal Code and the Information Technology Act.
                    </p>
                    <div className="space-y-2">
                      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px]">
                        <div className="font-bold text-white">Extortion & Sextortion</div>
                        <div className="text-cyan-400 font-mono">IPC Sec 384 & IT Act 66E/67A</div>
                      </div>
                      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px]">
                        <div className="font-bold text-white">Cyberstalking</div>
                        <div className="text-cyan-400 font-mono">IPC Sec 354D (BNS Sec 78)</div>
                      </div>
                      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px]">
                        <div className="font-bold text-white">Criminal Intimidation</div>
                        <div className="text-cyan-400 font-mono">IPC Sec 506 (BNS Sec 351)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ===================================================================== */
              /* POST-SUBMISSION LEGAL COMPLAINT DOSSIER VIEW */
              /* ===================================================================== */
              <div className="space-y-6">
                {/* Success Banner */}
                <div className="bg-gradient-to-r from-emerald-950/70 via-cyan-950/50 to-slate-900/80 border border-emerald-500/40 rounded-3xl p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-white">Complaint Sealed & Legal Dossier Generated</h2>
                        <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          {submittedReport.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Tracking Ticket: <span className="font-mono font-bold text-cyan-300">{submittedReport.ticketId}</span> • Master SHA-256 Digest verified.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start md:self-auto">
                    <button
                      onClick={printDossier}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-600 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print FIR Dossier</span>
                    </button>
                    <button
                      onClick={resetForm}
                      className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>New Complaint</span>
                    </button>
                  </div>
                </div>

                {/* Metrics & Urgency Gauge Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Severity Score Card */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      AI Severity Rating
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">
                        {(submittedReport.severityScore * 100).toFixed(0)}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">/ 100</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ml-auto ${
                          submittedReport.urgencyLevel === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {submittedReport.urgencyLevel} RISK
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 h-1.5"
                        style={{ width: `${submittedReport.severityScore * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Flagged Statutes Count */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Applicable Legal Statutes
                    </span>
                    <div className="text-3xl font-black text-cyan-300">
                      {submittedReport.legalSectionsFlagged?.length || 0}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      Flagged under IT Act & IPC / BNS
                    </div>
                  </div>

                  {/* Evidence Items Count */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Hashed Evidence Files
                    </span>
                    <div className="text-3xl font-black text-indigo-300">
                      {submittedReport.evidenceFiles?.length || 0}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      Cryptographically Sealed
                    </div>
                  </div>

                  {/* Master Hash Digest */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Master SHA-256 Digest
                    </span>
                    <div className="text-xs font-mono text-cyan-400 truncate mt-1">
                      {submittedReport.hashDigest}
                    </div>
                    <button
                      onClick={() => copyToClipboard(submittedReport.hashDigest, "master_hash")}
                      className="mt-2 text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === "master_hash" ? "Copied!" : "Copy Full Hash"}</span>
                    </button>
                  </div>
                </div>

                {/* Flagged Legal Statutes Details */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                    <Scale className="w-4 h-4 text-cyan-400" />
                    <span>Prima Facie Statutory Provisions Identified for FIR Registration</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {submittedReport.legalSectionsFlagged?.map((statute, i) => (
                      <div
                        key={i}
                        className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-cyan-300 font-mono">
                              {statute.section}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{statute.act}</span>
                          </div>
                          <div className="text-sm font-bold text-white">{statute.title}</div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {statute.description}
                          </p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-amber-300 font-medium">Punishment: {statute.punishment}</span>
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                              statute.cognizable ? "bg-rose-500/20 text-rose-300" : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {statute.cognizable ? "Cognizable" : "Non-Cognizable"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Printable Formal FIR Legal Complaint Dossier */}
                <div className="bg-slate-950 border border-slate-700/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative print:border-none print:p-0">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                        LEGAL COMPLAINT DOSSIER • FORM 154 CrPC DRAFT
                      </span>
                      <h2 className="text-xl font-black text-white mt-1">
                        Cyber Crime Police First Information Report (FIR) Draft
                      </h2>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(submittedReport.legalDossier?.victimStatement || "", "fir_text")
                      }
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition border border-slate-700 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedKey === "fir_text" ? "Copied!" : "Copy FIR Text"}</span>
                    </button>
                  </div>

                  <div className="mt-6 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80">
                    {submittedReport.legalDossier?.victimStatement}
                  </div>

                  {/* IO Checklist */}
                  <div className="mt-6 pt-6 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                      Investigating Officer (IO) Action Checklist:
                    </h4>
                    <div className="space-y-2">
                      {submittedReport.legalDossier?.investigatingOfficerChecklist?.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/50"
                        >
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: THREAT VAULT RECORDS (SEARCHABLE REGISTRY) */}
        {/* ========================================================================= */}
        {activeTab === "records" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  placeholder="Search by Ticket ID, Handle, or Category..."
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <button
                onClick={loadRecords}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-700 cursor-pointer self-end sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecords ? "animate-spin" : ""}`} />
                <span>Refresh Registry</span>
              </button>
            </div>

            {isLoadingRecords ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-3" />
                <span>Loading threat registry...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
                <ShieldCheck className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm">No threat records match your query.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records
                  .filter((r) =>
                    !recordSearch
                      ? true
                      : r.ticketId.toLowerCase().includes(recordSearch.toLowerCase()) ||
                        r.threatCategory.toLowerCase().includes(recordSearch.toLowerCase()) ||
                        r.incidentMeta.suspectHandle?.toLowerCase().includes(recordSearch.toLowerCase())
                  )
                  .map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className="p-5 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            rec.urgencyLevel === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                              : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40"
                          }`}
                        >
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono font-black text-sm text-cyan-300">{rec.ticketId}</span>
                            <span className="text-xs font-bold text-white">
                              {rec.threatCategory.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                              Platform: {rec.incidentMeta.platform}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-xl">
                            {rec.incidentMeta.narrative}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-2">
                            <span>Suspect: {rec.incidentMeta.suspectHandle || "N/A"}</span>
                            <span>•</span>
                            <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="text-emerald-400">
                              SHA-256 Digest: {rec.hashDigest.slice(0, 12)}...
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto">
                        <div className="text-right">
                          <div className="text-xs font-black text-white">
                            {(rec.severityScore * 100).toFixed(0)}% Severity
                          </div>
                          <div className="text-[10px] font-mono text-cyan-400">{rec.status}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Modal for Record Details */}
            {selectedRecord && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <span className="text-xs font-mono text-cyan-400 font-bold">{selectedRecord.ticketId}</span>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {selectedRecord.threatCategory.replace(/_/g, " ")}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedRecord(null)}
                      className="p-2 text-slate-400 hover:text-white rounded-xl transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                        Statement of Facts:
                      </span>
                      <p className="text-slate-200 bg-slate-950 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                        {selectedRecord.incidentMeta.narrative}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block">Platform:</span>
                        <span className="font-bold text-white">{selectedRecord.incidentMeta.platform}</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block">Suspect Handle:</span>
                        <span className="font-bold text-white">{selectedRecord.incidentMeta.suspectHandle || "N/A"}</span>
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                        Cryptographic Master Digest:
                      </span>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-cyan-400 truncate">
                        {selectedRecord.hashDigest}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                        Statutory Sections Tagged:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRecord.legalSectionsFlagged?.map((s, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono"
                          >
                            {s.section} ({s.title})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedRecord(null)}
                      className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: STATUTORY LEGAL GUIDE */}
        {/* ========================================================================= */}
        {activeTab === "statutes" && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                <span>Indian Cyber Law & Penal Code Reference Matrix</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Summary of statutory remedies under the Information Technology Act, 2000 and the Indian Penal Code
                (IPC) / Bharatiya Nyaya Sanhita (BNS) governing online harassment, extortion, and cyber threats.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STATUTE_CATALOG.map((statute, i) => (
                <div
                  key={i}
                  className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        {statute.section}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{statute.act}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{statute.title}</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{statute.description}</p>
                    <div className="mt-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-300">
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Applicability:</span>
                      {statute.relevanceReason}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-amber-400 font-medium font-mono">{statute.punishment}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                        statute.bailable ? "bg-slate-800 text-slate-400" : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {statute.bailable ? "Bailable" : "Non-Bailable"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🚨 URGENCY TRIGGER MODAL (AUTO-POPS ON HIGH-RISK THREATS) */}
      {/* ========================================================================= */}
      {showUrgencyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-gradient-to-b from-rose-950 via-slate-900 to-black border-2 border-rose-500/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl shadow-rose-950/80">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 animate-bounce">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">
                  HIGH RISK PRIORITY TRIGGER
                </span>
                <h3 className="text-lg font-black text-white">
                  Active Extortion / Physical Violence Threat Detected
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              You selected a critical threat category (<strong className="text-rose-300">{threatCategory.replace(/_/g, " ")}</strong>). If you are in immediate physical danger or facing financial blackmail, please utilize emergency services right now:
            </p>

            {/* Click-to-Call Emergency Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="tel:1930"
                className="p-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-2xl flex items-center gap-3 font-bold text-xs shadow-lg shadow-amber-950/50 transition"
              >
                <PhoneCall className="w-5 h-5 text-amber-200" />
                <div>
                  <div className="text-[10px] text-amber-200 font-normal uppercase">Cyber Helpline</div>
                  <div className="text-sm font-black">Call 1930</div>
                </div>
              </a>

              <a
                href="tel:112"
                className="p-3.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-2xl flex items-center gap-3 font-bold text-xs shadow-lg shadow-rose-950/50 transition"
              >
                <PhoneCall className="w-5 h-5 text-rose-200" />
                <div>
                  <div className="text-[10px] text-rose-200 font-normal uppercase">Police Emergency</div>
                  <div className="text-sm font-black">Call 112</div>
                </div>
              </a>
            </div>

            {/* Immediate Safety Instructions */}
            <div className="p-3.5 bg-black/60 rounded-2xl border border-rose-500/30 text-xs text-slate-300 space-y-1.5">
              <div className="font-bold text-rose-300 text-[11px] uppercase tracking-wider">
                Immediate Protective Actions:
              </div>
              <p>• <strong>Do NOT send any funds</strong>, gift cards, or crypto.</p>
              <p>• <strong>Preserve all chat threads</strong> before the offender unsends messages.</p>
              <p>• <strong>Lock down social profiles</strong> to prevent contact scraping.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUrgencyModal(false);
                  setHasAcknowledgedUrgency(true);
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                I Understand — Continue Filing Complaint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
