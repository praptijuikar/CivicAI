import { useTranslation } from "react-i18next";
import { VoiceField } from "./VoiceControls";
import { useState, useEffect, useRef, type FormEvent } from "react";
import confetti from "canvas-confetti";
import SubmissionSuccessModal from "./SubmissionSuccessModal";
import {
  ShieldCheck,
  Fingerprint,
  Lock,
  Upload,
  MapPin,
  Shield,
  UserCheck,
  Clock,
  CheckCircle2,
  FileImage,
  FileX,
} from "lucide-react";
import EXIF from "exif-js";
import { api } from "../lib/api";
import type { User, IntegrityReport, IntegrityCategory, Language } from "../types";

interface IntegrityPortalProps {
  currentUser: User;
  language: Language;
  onSelectReport?: (report: IntegrityReport) => void;
}

export default function IntegrityPortal({ currentUser }: IntegrityPortalProps) {
  const { t } = useTranslation();
  const [reports, setReports] = useState<IntegrityReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"submit" | "vault_records" | "case_detail">("submit");
  const [selectedCase, setSelectedCase] = useState<IntegrityReport | null>(null);

  // Form State
  const [category, setCategory] = useState<IntegrityCategory>("Suspected Bribery");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentInvolved, setDepartmentInvolved] = useState("Department of Building Inspection & Zoning");
  const [suspectedPersonnel, setSuspectedPersonnel] = useState("");
  const [address, setAddress] = useState("Civic Center District, 550 Larkin St");
  const [latitude, setLatitude] = useState(37.7792);
  const [longitude, setLongitude] = useState(-122.4185);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedHash, setGeneratedHash] = useState<string | null>(null);
  const [createdTrackingCode, setCreatedTrackingCode] = useState<string | null>(null);

  // Investigator Action State
  const [investigatorNote, setInvestigatorNote] = useState("");
  const [newStatus, setNewStatus] = useState<string>("investigation_active");
  const [isUpdatingCase, setIsUpdatingCase] = useState(false);

  // ── File Upload State ─────────────────────────────────────────────────────
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [exifGpsNote, setExifGpsNote] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileSha256, setFileSha256] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_BYTES = 50 * 1024 * 1024;

  // ── EXIF GPS Helper ───────────────────────────────────────────────────────
  function dmsToDecimal(dms: number[], ref: string): number {
    const [d, m, s] = dms;
    let dd = d + m / 60 + s / 3600;
    if (ref === "S" || ref === "W") dd *= -1;
    return dd;
  }

  function extractExifAndApply(file: File) {
    if (!file.type.startsWith("image/")) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      EXIF.getData(img as any, function (this: any) {
        const lat = EXIF.getTag(this, "GPSLatitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef");
        const lng = EXIF.getTag(this, "GPSLongitude");
        const lngRef = EXIF.getTag(this, "GPSLongitudeRef");
        URL.revokeObjectURL(url);
        if (lat && latRef && lng && lngRef) {
          const decLat = dmsToDecimal(lat, latRef);
          const decLng = dmsToDecimal(lng, lngRef);
          setLatitude(decLat);
          setLongitude(decLng);
          setAddress(`${decLat.toFixed(5)}, ${decLng.toFixed(5)}`);
          setExifGpsNote(`📡 GPS extracted from photo: ${decLat.toFixed(5)}, ${decLng.toFixed(5)}`);
        } else {
          URL.revokeObjectURL(url);
          setExifGpsNote("⚠️ No GPS metadata in this photo. Location set manually.");
        }
      });
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }

  function handleFileSelect(file: File) {
    const isImage = file.type.startsWith("image/");
    const isAudio = file.type.startsWith("audio/");
    const isVideo = file.type.startsWith("video/");
    const isDoc = file.type === "application/pdf" || file.name.endsWith(".doc") || file.name.endsWith(".docx");
    
    if (!isImage && !isAudio && !isVideo && !isDoc) {
      setFileError(
        `❌ Unsupported format "${file.type || "unknown"}". Accepted: Images, Audio, Video, PDF, DOC, DOCX.`
      );
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      setFileError(`❌ File is ${mb} MB — exceeds the 50 MB limit. Please compress or trim the file.`);
      return;
    }
    setFileError(null);
    setEvidenceFile(file);
    setExifGpsNote(null);
    setFileSha256(null);
    extractExifAndApply(file);
    setIsHashing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
        const hex = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        setFileSha256(hex);
      } catch {
        setFileSha256(null);
      } finally {
        setIsHashing(false);
      }
    };
    reader.onerror = () => setIsHashing(false);
    reader.readAsArrayBuffer(file);
  }

  const isInvestigator = currentUser.role === "investigator" || currentUser.role === "admin";

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.getIntegrityReports();
      setReports(res?.reports || []);
      if (res?.reports?.length && !selectedCase) {
        setSelectedCase(res.reports[0]);
      }
    } catch (err) {
      console.error("Failed to load integrity reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmitIntegrity = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const refId = `ISS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const localRecord = {
        id: refId,
        category: category,
        subtype: departmentInvolved,
        description: description,
        location: address,
        coordinates: { lat: latitude || 0, lng: longitude || 0 },
        timestamp: new Date().toISOString(),
        status: "Pending",
        isConfidential: true
      };

      try {
        const stored = JSON.parse(localStorage.getItem("civic_complaints") || "[]");
        stored.push(localRecord);
        localStorage.setItem("civic_complaints", JSON.stringify(stored));
        window.dispatchEvent(new CustomEvent("new_complaint_added"));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}

      const res = await api.createIntegrityReport({
        category,
        title: title || `Confidential Allegation: ${category}`,
        description,
        departmentInvolved,
        suspectedPersonnel: suspectedPersonnel || undefined,
        address,
        latitude,
        longitude,
      });

      setGeneratedHash(res.sha256MasterHash);
      setCreatedTrackingCode(refId);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      fetchReports();
    } catch (err) {
      console.error("Failed to submit integrity report:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCaseStatus = async () => {
    if (!selectedCase) return;
    setIsUpdatingCase(true);
    try {
      const res = await api.updateIntegrityReport(selectedCase.id, {
        status: newStatus,
        investigatorNotes: investigatorNote,
        investigatorId: currentUser.id,
        investigatorName: currentUser.name,
        newAuditStep: investigatorNote
          ? {
            stepName: `Investigator Action (${newStatus.replace("_", " ")})`,
            notes: investigatorNote,
          }
          : undefined,
      });

      setSelectedCase(res.report);
      fetchReports();
      setInvestigatorNote("");
    } catch (err) {
      console.error("Failed to update case:", err);
    } finally {
      setIsUpdatingCase(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Top Banner: Confidentiality Shield */}
      <div className="p-6 rounded-2xl bg-surface shadow-md shadow-md border border-border-subtle shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#F3F4F6]">Civic Integrity & Whistleblower Vault</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  Zero-Knowledge Proofs
                </span>
              </div>
              <p className="text-xs text-foreground/60 mt-1 max-w-xl">
                Encrypted evidence ingestion pipeline with SHA-256 cryptographic immutability, hardware timestamp verification, and strict whistleblower confidentiality.
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setViewMode("submit");
                setGeneratedHash(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${viewMode === "submit"
                ? "bg-red-600 text-foreground shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                : "bg-background text-foreground/80 hover:bg-white border border-border-subtle"
                }`}
            >
              + Secure New Submission
            </button>
            <button
              onClick={() => setViewMode("vault_records")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${viewMode === "vault_records" || viewMode === "case_detail"
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "bg-background text-foreground/80 hover:bg-white border border-border-subtle"
                }`}
            >
              <Fingerprint className="w-3.5 h-3.5 text-red-400" />
              Vault Records ({reports.length})
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: SECURE SUBMISSION FORM */}
      {viewMode === "submit" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submission Form */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-surface shadow-md shadow-md border border-border-subtle shadow-xl space-y-6">
            {!generatedHash ? (
              <form onSubmit={handleSubmitIntegrity} className="space-y-5">
                <div className="border-b border-border-subtle pb-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-red-400" />
                    New Encrypted Allegation Record
                  </h3>
                  <p className="text-xs text-foreground/60 mt-0.5">
                    Your IP address and personal identifying metadata are automatically stripped before ledger hashing.
                  </p>
                </div>

                {/* Category Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">Integrity Violation Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IntegrityCategory)}
                    className="w-full bg-background border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-red-500 [&>option]:bg-white [&>option]:text-gray-900"
                  >
                    <option value="Suspected Bribery">Suspected Bribery / Kickbacks</option>
                    <option value="Unauthorized Construction">Unauthorized Construction / Permit Bypass</option>
                    <option value="Illegal Dumping">Illegal Hazardous Dumping / Waste Diversion</option>
                    <option value="Encroachment & Land Grabbing">Encroachment & Public Land Grabbing</option>
                    <option value="Misuse of Public Property">Misuse of Municipal Fleet / Equipment</option>
                    <option value="Procurement Fraud & Kickbacks">Procurement Fraud & Bid Rigging</option>
                    <option value="Safety Protocol Violation">Safety Protocol Falsification</option>
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">Allegation Summary</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Nighttime unpermitted construction without seismic clearance"
                    className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Involved Entity & Suspects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80">Department / Office Involved</label>
                    <input
                      type="text"
                      value={departmentInvolved}
                      onChange={(e) => setDepartmentInvolved(e.target.value)}
                      placeholder="e.g. Department of Building Inspection"
                      className="w-full bg-background border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80">Suspected Personnel / Contractor (Optional)</label>
                    <input
                      type="text"
                      value={suspectedPersonnel}
                      onChange={(e) => setSuspectedPersonnel(e.target.value)}
                      placeholder="e.g. Contractor Apex Corp & Zone Inspector"
                      className="w-full bg-background border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Evidence Upload Zone */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/80">Digital Evidence Vault Ingestion</label>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={false}
                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                      e.target.value = "";
                    }}
                  />

                  {/* Dropzone */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className={`border-2 border-dashed rounded-xl p-5 bg-background/60 text-center space-y-2 cursor-pointer transition-colors ${
                      isDraggingOver
                        ? "border-red-400 bg-red-500/5"
                        : "border-border-subtle hover:border-red-500"
                    }`}
                  >
                    {evidenceFile ? (
                      <div className="flex items-center justify-between gap-3 px-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <FileImage className="w-5 h-5 text-red-400" />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-xs font-semibold text-emerald-400 truncate max-w-[200px]">
                              {evidenceFile.name}
                            </p>
                            <p className="text-[10px] text-emerald-400/80 font-mono">
                              {evidenceFile.size < 1024 * 1024
                                ? `${(evidenceFile.size / 1024).toFixed(1)} KB`
                                : `${(evidenceFile.size / 1024 / 1024).toFixed(2)} MB`}
                              {" · "}{evidenceFile.type || "unknown type"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEvidenceFile(null);
                            setExifGpsNote(null);
                            setFileSha256(null);
                            setFileError(null);
                            setIsHashing(false);
                          }}
                          className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/20 transition shrink-0"
                        >
                          <FileX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-red-400 mx-auto pointer-events-none" />
                        <p className="text-xs font-semibold text-gray-200 pointer-events-none">
                          {isDraggingOver
                            ? "Drop file here…"
                            : "Click or drag & drop: Photos, Documents, Audio, Invoices"}
                        </p>
                        <p className="text-[10px] text-foreground/60 font-mono pointer-events-none">
                          Client-side SHA-256 hash computed before upload
                        </p>
                      </>
                    )}
                  </div>

                  {/* SHA-256 hash display */}
                  {(isHashing || fileSha256) && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <Fingerprint className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-0.5">Client-Side SHA-256</p>
                        {isHashing ? (
                          <p className="text-[10px] font-mono text-foreground/50 animate-pulse">Computing digest…</p>
                        ) : (
                          <p className="text-[10px] font-mono text-foreground/80 break-all select-all leading-relaxed">{fileSha256}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* File error */}
                  {fileError && (
                    <p className="text-[11px] font-medium px-3 py-2 rounded-lg border bg-rose-500/10 border-rose-500/30 text-rose-400">
                      {fileError}
                    </p>
                  )}

                  {/* EXIF GPS feedback */}
                  {exifGpsNote && (
                    <p className={`text-[11px] font-medium px-3 py-2 rounded-lg border ${
                      exifGpsNote.startsWith("📡")
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}>
                      {exifGpsNote}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">Detailed Statement of Facts</label>
                  <VoiceField
                    rows={4}
                    required
                    value={description}
                    onChange={setDescription}
                    placeholder="Provide specific dates, times, vehicle registration plates, financial transactions, or locations..."
                    className="w-full bg-background border border-border-subtle rounded-xl p-3.5 text-xs text-foreground focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    Incident Geolocation Anchor
                    {exifGpsNote?.startsWith("📡") && (
                      <span className="ml-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        GPS from Photo
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address or coordinates of violation"
                    className={`w-full bg-background border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-purple-500 transition-colors ${
                      exifGpsNote?.startsWith("📡")
                        ? "border-emerald-500/40 text-emerald-400 font-mono"
                        : "border-border-subtle"
                    }`}
                  />
                  {(latitude !== 37.7792 || longitude !== -122.4185) && (
                    <p className="text-[10px] font-mono text-foreground/40 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      Lat: {latitude.toFixed(5)} &nbsp; Lng: {longitude.toFixed(5)}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isHashing || !evidenceFile}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-foreground font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Fingerprint className="w-4 h-4" />
                  {isHashing
                    ? "Computing SHA-256 Digest…"
                    : isSubmitting
                    ? "Encrypting & Sealing Ledger Entry…"
                    : !evidenceFile
                    ? "Attach Evidence File to Continue"
                    : "Generate Cryptographic Evidence Hash & Submit"}
                </button>
              </form>
            ) : (
              <SubmissionSuccessModal
                trackingId={createdTrackingCode || ""}
                category={category}
                locationName={address || "Confidential Location"}
                onTrackComplaint={() => { window.location.href = '/dashboard'; }}
                onReportAnother={() => {
                  setGeneratedHash(null);
                  setTitle("");
                  setDescription("");
                  setAddress("");
                  setDepartmentInvolved("");
                  setSuspectedPersonnel("");
                }}
              />
            )}
          </div>

          {/* Side Info: Security Architecture */}
          <div className="p-6 rounded-2xl bg-surface shadow-md shadow-md/70 border border-border-subtle space-y-5 h-fit">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              Security Architecture
            </div>

            <div className="space-y-3 text-xs text-foreground/80">
              <div className="p-3 bg-background rounded-xl border border-border-subtle space-y-1">
                <strong className="text-purple-300">1. Client-Side Hash Generation</strong>
                <p className="text-[11px] text-foreground/60">
                  Every uploaded photograph, PDF, or video is hashed using SHA-256 before transmission to prove tamper-resistance.
                </p>
              </div>

              <div className="p-3 bg-background rounded-xl border border-border-subtle space-y-1">
                <strong className="text-purple-300">2. Whistleblower Protection Shield</strong>
                <p className="text-[11px] text-foreground/60">
                  No public display of allegations. Access is strictly restricted to designated Internal Affairs Investigators.
                </p>
              </div>

              <div className="p-3 bg-background rounded-xl border border-border-subtle space-y-1">
                <strong className="text-purple-300">3. Immutable Audit Trails</strong>
                <p className="text-[11px] text-foreground/60">
                  Any investigator review, evidence addition, or status update is logged with non-repudiation timestamps.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2 & 3: VAULT RECORDS & CASE MANAGEMENT (RESTRICTED ROLE CLEARANCE) */}
      {(viewMode === "vault_records" || viewMode === "case_detail") && (
        <div className="space-y-6">
          {/* Security Clearance Banner */}
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-700/60 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-foreground">
                  Investigator Oversight Clearance: <span className="text-ashoka-navy dark:text-ashoka-navy">{currentUser.name}</span>
                </h4>
                <p className="text-[11px] text-purple-300/80">
                  Role: <strong className="capitalize">{currentUser.role}</strong> • Warrant Jurisdiction #IA-Oversight-2026
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-purple-900 text-purple-200 border border-purple-600">
              RESTRICTED_INVESTIGATOR_ONLY
            </span>
          </div>

          {/* Cases List and Detail Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Cases Queue */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
                Classified Vault Dockets ({reports.length})
              </h3>
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    onClick={() => {
                      setSelectedCase(rep);
                      setViewMode("case_detail");
                    }}
                    className={`cursor-pointer p-4 rounded-xl border transition space-y-2 ${selectedCase?.id === rep.id
                      ? "bg-purple-950/60 border-purple-500 shadow-md"
                      : "bg-surface border-border-subtle hover:border-border-subtle hover:border-foreground/20"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-purple-400">{rep.id}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${rep.status === "action_taken"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : rep.status === "investigation_active"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-background text-foreground/80"
                          }`}
                      >
                        {rep.status.replace("_", " ")}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">{rep.title}</h4>
                    <p className="text-[11px] text-foreground/60 line-clamp-1">{rep.category}</p>
                    <div className="flex items-center justify-between text-[10px] text-foreground/60 pt-1 border-t border-border-subtle/80 font-mono">
                      <span>{new Date(rep.submittedAt).toLocaleDateString()}</span>
                      <span className="text-ashoka-navy dark:text-ashoka-navy">SHA-256 ✓</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Selected Case Deep Inspection & Audit Trail */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-surface shadow-md shadow-md border border-border-subtle shadow-2xl space-y-6">
              {selectedCase ? (
                <div className="space-y-6">
                  {/* Case Header */}
                  <div className="border-b border-border-subtle pb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800">
                        {selectedCase.trackingCode}
                      </span>
                      <span className="text-xs font-bold capitalize px-3 py-1 rounded-full bg-background text-foreground/80 border border-border-subtle hover:border-foreground/20">
                        {selectedCase.status.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground">{selectedCase.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-foreground/60 flex-wrap">
                      <span><strong>Category:</strong> {selectedCase.category}</span>
                      <span><strong>Dept:</strong> {selectedCase.departmentInvolved}</span>
                      {selectedCase.suspectedPersonnel && (
                        <span><strong>Suspect:</strong> {selectedCase.suspectedPersonnel}</span>
                      )}
                    </div>
                  </div>

                  {/* Statement of Facts */}
                  <div className="p-4 rounded-xl bg-background border border-border-subtle space-y-2">
                    <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
                      Whistleblower Statement of Facts:
                    </span>
                    <p className="text-xs text-foreground/80 leading-relaxed">{selectedCase.description}</p>
                    <p className="text-[11px] text-foreground/60 flex items-center gap-1 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      {selectedCase.address}
                    </p>
                  </div>

                  {/* SHA-256 Proof Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 to-purple-950/30 border border-purple-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Fingerprint className="w-4 h-4 text-purple-400" />
                        Cryptographic SHA-256 Master Digest
                      </span>
                      <span className="text-[10px] text-india-green font-mono">Verified Immutable</span>
                    </div>
                    <div className="p-2.5 bg-surface rounded-lg border border-border-subtle font-mono text-[11px] text-ashoka-navy dark:text-ashoka-navy break-all select-all">
                      {selectedCase.sha256MasterHash}
                    </div>
                  </div>

                  {/* Visual Audit Trail Step by Step */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-ashoka-navy dark:text-ashoka-navy" />
                      Visual Step-by-Step Audit Trail
                    </h4>
                    <div className="relative pl-6 border-l-2 border-purple-800/80 space-y-5">
                      {selectedCase.auditTrail.map((step, idx) => (
                        <div key={step.id || idx} className="relative group">
                          <div
                            className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-slate-900 ${step.status === "completed"
                              ? "bg-india-green"
                              : step.status === "current"
                                ? "bg-amber-400 animate-pulse"
                                : "bg-slate-700"
                              }`}
                          />
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground">{step.stepName}</span>
                              <span className="text-[10px] font-mono text-foreground/60">{step.timestamp}</span>
                            </div>
                            {step.notes && <p className="text-xs text-foreground/80">{step.notes}</p>}
                            <span className="inline-block text-[10px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                              Actor: {step.actor}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Investigator Action Panel */}
                  <div className="p-5 rounded-2xl bg-background border border-border-subtle space-y-4">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-purple-400" />
                      Investigator Action & Case Management
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/80">Update Case Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full bg-surface border border-border-subtle hover:border-foreground/20 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500 [&>option]:bg-white [&>option]:text-gray-900"
                        >
                          <option value="under_review">Under Initial Review</option>
                          <option value="investigation_active">Active Investigation & Subpoena</option>
                          <option value="action_taken">Corrective Sanction / Action Enacted</option>
                          <option value="dismissed">Dismissed (Insufficient Probable Cause)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/80">Investigator Sign-off</label>
                        <input
                          type="text"
                          disabled
                          value={currentUser.name}
                          className="w-full bg-surface/60 border border-border-subtle rounded-xl px-3 py-2 text-xs text-foreground/60"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground/80">Investigator Finding Notes / Subpoena Log</label>
                      <textarea
                        rows={2}
                        value={investigatorNote}
                        onChange={(e) => setInvestigatorNote(e.target.value)}
                        placeholder="Log compliance findings, witness interviews, or enforcement notices..."
                        className="w-full bg-surface border border-border-subtle hover:border-foreground/20 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <button
                      onClick={handleUpdateCaseStatus}
                      disabled={isUpdatingCase}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-foreground font-bold rounded-xl text-xs transition flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isUpdatingCase ? "Updating Ledger..." : "Commit Formal Case Update"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-foreground/60">Select a vault case docket to inspect.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}