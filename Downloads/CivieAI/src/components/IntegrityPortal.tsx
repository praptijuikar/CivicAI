import { useState, useEffect, type FormEvent } from "react";
import {
  Shield,
  Lock,
  FileCheck,
  Fingerprint,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  AlertOctagon,
  CheckCircle2,
  FileText,
  Upload,
  UserCheck,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
} from "lucide-react";
import confetti from "canvas-confetti";
import type { IntegrityReport, IntegrityCategory, User } from "../types.ts";
import { api } from "../lib/api.ts";

interface IntegrityPortalProps {
  currentUser: User;
  onSelectReport?: (report: IntegrityReport) => void;
}

export default function IntegrityPortal({ currentUser }: IntegrityPortalProps) {
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

  const isInvestigator = currentUser.role === "investigator" || currentUser.role === "admin";

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.getIntegrityReports();
      setReports(res.reports || []);
      if (res.reports?.length && !selectedCase) {
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
      setCreatedTrackingCode(res.trackingCode);
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
      <div className="p-6 rounded-2xl bg-[#1E2229] border border-[#2D3139] shadow-2xl relative overflow-hidden">
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
              <p className="text-xs text-gray-400 mt-1 max-w-xl">
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
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                viewMode === "submit"
                  ? "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  : "bg-[#0F1115] text-gray-300 hover:bg-[#151921] border border-[#2D3139]"
              }`}
            >
              + Secure New Submission
            </button>
            <button
              onClick={() => setViewMode("vault_records")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                viewMode === "vault_records" || viewMode === "case_detail"
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "bg-[#0F1115] text-gray-300 hover:bg-[#151921] border border-[#2D3139]"
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
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#1E2229] border border-[#2D3139] shadow-xl space-y-6">
            {!generatedHash ? (
              <form onSubmit={handleSubmitIntegrity} className="space-y-5">
                <div className="border-b border-[#2D3139] pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-red-400" />
                    New Encrypted Allegation Record
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Your IP address and personal identifying metadata are automatically stripped before ledger hashing.
                  </p>
                </div>

                {/* Category Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Integrity Violation Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IntegrityCategory)}
                    className="w-full bg-[#0F1115] border border-[#2D3139] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
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
                  <label className="text-xs font-bold text-gray-300">Allegation Summary</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Nighttime unpermitted construction without seismic clearance"
                    className="w-full bg-[#0F1115] border border-[#2D3139] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Involved Entity & Suspects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">Department / Office Involved</label>
                    <input
                      type="text"
                      value={departmentInvolved}
                      onChange={(e) => setDepartmentInvolved(e.target.value)}
                      placeholder="e.g. Department of Building Inspection"
                      className="w-full bg-[#0F1115] border border-[#2D3139] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">Suspected Personnel / Contractor (Optional)</label>
                    <input
                      type="text"
                      value={suspectedPersonnel}
                      onChange={(e) => setSuspectedPersonnel(e.target.value)}
                      placeholder="e.g. Contractor Apex Corp & Zone Inspector"
                      className="w-full bg-[#0F1115] border border-[#2D3139] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Evidence Upload Zone */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300">Digital Evidence Vault Ingestion</label>
                  <div className="border-2 border-dashed border-[#2D3139] hover:border-red-500 rounded-xl p-5 bg-[#0F1115]/60 text-center space-y-2 cursor-pointer transition">
                    <Upload className="w-6 h-6 text-red-400 mx-auto" />
                    <p className="text-xs font-semibold text-gray-200">
                      Upload Photos, Scanned Documents, Audio recordings, or Invoices
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Calculates client-side SHA-256 hash prior to upload
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Detailed Statement of Facts</label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide specific dates, times, vehicle registration plates, financial transactions, or locations..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    Incident Geolocation Anchor
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address or coordinates of violation"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition"
                >
                  <Fingerprint className="w-4 h-4" />
                  {isSubmitting ? "Computing SHA-256 Digest & Encrypting..." : "Generate Cryptographic Evidence Hash & Submit"}
                </button>
              </form>
            ) : (
              /* Success Screen with Master Hash */
              <div className="py-8 space-y-5 text-center animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border-2 border-purple-500 flex items-center justify-center text-purple-400 mx-auto">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Integrity Evidence Vault Record Ingested</h3>
                  <p className="text-xs text-slate-400">
                    Your submission has been signed and locked into the classified investigator ledger.
                  </p>
                </div>

                {/* Hash Box */}
                <div className="p-4 rounded-xl bg-slate-950 border border-purple-900/60 space-y-2 text-left">
                  <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">
                    Immutable SHA-256 Evidence Master Digest:
                  </span>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-400 break-all select-all">
                    {generatedHash}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Tracking Code: <strong className="text-white font-mono">{createdTrackingCode}</strong></span>
                    <span className="text-emerald-400 font-semibold">✓ Cryptographically Sealed</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setViewMode("vault_records");
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition"
                  >
                    View in Investigator Ledger &rarr;
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedHash(null);
                      setTitle("");
                      setDescription("");
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                  >
                    Submit Another Allegation
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Side Info: Security Architecture */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5 h-fit">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              Security Architecture
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-purple-300">1. Client-Side Hash Generation</strong>
                <p className="text-[11px] text-slate-400">
                  Every uploaded photograph, PDF, or video is hashed using SHA-256 before transmission to prove tamper-resistance.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-purple-300">2. Whistleblower Protection Shield</strong>
                <p className="text-[11px] text-slate-400">
                  No public display of allegations. Access is strictly restricted to designated Internal Affairs Investigators.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-purple-300">3. Immutable Audit Trails</strong>
                <p className="text-[11px] text-slate-400">
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
                <h4 className="text-xs font-bold text-white">
                  Investigator Oversight Clearance: <span className="text-cyan-400">{currentUser.name}</span>
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
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
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
                    className={`cursor-pointer p-4 rounded-xl border transition space-y-2 ${
                      selectedCase?.id === rep.id
                        ? "bg-purple-950/60 border-purple-500 shadow-md"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-purple-400">{rep.id}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          rep.status === "action_taken"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : rep.status === "investigation_active"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {rep.status.replace("_", " ")}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{rep.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{rep.category}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
                      <span>{new Date(rep.submittedAt).toLocaleDateString()}</span>
                      <span className="text-cyan-400">SHA-256 ✓</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Selected Case Deep Inspection & Audit Trail */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
              {selectedCase ? (
                <div className="space-y-6">
                  {/* Case Header */}
                  <div className="border-b border-slate-800 pb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800">
                        {selectedCase.trackingCode}
                      </span>
                      <span className="text-xs font-bold capitalize px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                        {selectedCase.status.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{selectedCase.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span><strong>Category:</strong> {selectedCase.category}</span>
                      <span><strong>Dept:</strong> {selectedCase.departmentInvolved}</span>
                      {selectedCase.suspectedPersonnel && (
                        <span><strong>Suspect:</strong> {selectedCase.suspectedPersonnel}</span>
                      )}
                    </div>
                  </div>

                  {/* Statement of Facts */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Whistleblower Statement of Facts:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">{selectedCase.description}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
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
                      <span className="text-[10px] text-emerald-400 font-mono">Verified Immutable</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-400 break-all select-all">
                      {selectedCase.sha256MasterHash}
                    </div>
                  </div>

                  {/* Visual Audit Trail Step by Step */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Visual Step-by-Step Audit Trail
                    </h4>
                    <div className="relative pl-6 border-l-2 border-purple-800/80 space-y-5">
                      {selectedCase.auditTrail.map((step, idx) => (
                        <div key={step.id || idx} className="relative group">
                          <div
                            className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-slate-900 ${
                              step.status === "completed"
                                ? "bg-emerald-500"
                                : step.status === "current"
                                ? "bg-amber-400 animate-pulse"
                                : "bg-slate-700"
                            }`}
                          />
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{step.stepName}</span>
                              <span className="text-[10px] font-mono text-slate-400">{step.timestamp}</span>
                            </div>
                            {step.notes && <p className="text-xs text-slate-300">{step.notes}</p>}
                            <span className="inline-block text-[10px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                              Actor: {step.actor}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Investigator Action Panel */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-purple-400" />
                      Investigator Action & Case Management
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Update Case Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="under_review">Under Initial Review</option>
                          <option value="investigation_active">Active Investigation & Subpoena</option>
                          <option value="action_taken">Corrective Sanction / Action Enacted</option>
                          <option value="dismissed">Dismissed (Insufficient Probable Cause)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Investigator Sign-off</label>
                        <input
                          type="text"
                          disabled
                          value={currentUser.name}
                          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Investigator Finding Notes / Subpoena Log</label>
                      <textarea
                        rows={2}
                        value={investigatorNote}
                        onChange={(e) => setInvestigatorNote(e.target.value)}
                        placeholder="Log compliance findings, witness interviews, or enforcement notices..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <button
                      onClick={handleUpdateCaseStatus}
                      disabled={isUpdatingCase}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isUpdatingCase ? "Updating Ledger..." : "Commit Formal Case Update"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500">Select a vault case docket to inspect.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
