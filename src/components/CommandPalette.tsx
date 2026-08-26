import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { Search, Compass, ShieldAlert, BadgeInfo, FileText, AlertCircle, Languages, Sparkles } from "lucide-react";
import type { CivicIssue, Language } from "../types";
import { translate } from "../lib/i18n";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPortal: (tab: "citizen" | "integrity" | "authority" | "officer" | "analytics") => void;
  onSelectIssue: (issue: CivicIssue) => void;
  issues: CivicIssue[];
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectPortal,
  onSelectIssue,
  issues,
  language,
  onLanguageChange,
}: CommandPaletteProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape, open on Cmd/Ctrl + K
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setAiResponse(null);
    }
  }, [isOpen]);

  // Handle general navigation shortcuts
  const items = [
    { icon: <Compass className="w-4 h-4 text-ashoka-navy dark:text-ashoka-navy" />, label: "Go to Citizen Portal", category: "Navigation", action: () => onSelectPortal("citizen") },
    { icon: <ShieldAlert className="w-4 h-4 text-rose-400" />, label: "Open Secure Integrity Vault (Whistleblower)", category: "Navigation", action: () => onSelectPortal("integrity") },
    { icon: <Compass className="w-4 h-4 text-indigo-400" />, label: "Go to Authority Dashboard", category: "Navigation", action: () => onSelectPortal("authority") },
    { icon: <Compass className="w-4 h-4 text-india-green" />, label: "Go to Field Operations", category: "Navigation", action: () => onSelectPortal("officer") },
    { icon: <Compass className="w-4 h-4 text-amber-400" />, label: "Go to System Analytics", category: "Navigation", action: () => onSelectPortal("analytics") },
    { icon: <Languages className="w-4 h-4 text-sky-400" />, label: "Switch to English", category: "Language", action: () => onLanguageChange("en") },
    { icon: <Languages className="w-4 h-4 text-sky-400" />, label: "Switch to हिन्दी (Hindi)", category: "Language", action: () => onLanguageChange("hi") },
    { icon: <Languages className="w-4 h-4 text-sky-400" />, label: "Switch to Español (Spanish)", category: "Language", action: () => onLanguageChange("es") },
    { icon: <Languages className="w-4 h-4 text-sky-400" />, label: "Switch to Français (French)", category: "Language", action: () => onLanguageChange("fr") },
  ];

  // AI Policy Q&A Simulated Database
  const getAiAnswer = (q: string): string | null => {
    const text = q.toLowerCase();
    if (text.includes("pothole") || text.includes("road") || text.includes("street")) {
      return "CivicAI Road Quality Policy: Potholes or street defects reported with visual evidence are triaged instantly. Standard SLA is 24 hours for Critical/High priority issues, and 72 hours for Moderate repairs. Field officers are automatically dispatched with GPS coordinates.";
    }
    if (text.includes("leak") || text.includes("water") || text.includes("sewer") || text.includes("pipe")) {
      return "Municipal Water Service Standard: Water main bursts and active sewer floods are routed directly to emergency plumbing units. Verification takes 15 minutes via AI image validation. Crews target resolution within 4 hours.";
    }
    if (text.includes("whistleblower") || text.includes("integrity") || text.includes("corruption") || text.includes("anonymous")) {
      return "Civic Integrity Protection: The Integrity Portal scrambles file EXIF metadata and generates a SHA-256 tamper-proof ledger record. Access is restricted to vetted external oversight officers. Citizens can track progress using the secret hash key.";
    }
    if (text.includes("sla") || text.includes("status") || text.includes("priority")) {
      return "Priority SLA Metrics: CivicAI dynamically scores tickets 0-100 based on severity, safety risk, and neighborhood population density. Critical: <12h SLA. High: <24h SLA. Moderate: <48h SLA. Low: <96h SLA.";
    }
    if (text.includes("how to report") || text.includes("report issue") || text.includes("submit")) {
      return "How to Report: 1. Click 'Report Issue'. 2. Capture/upload a photo of the defect. 3. CivicAI visually tags the hazard and assigns category/severity automatically. 4. Tap 'Submit' to route to dispatch.";
    }
    return null;
  };

  const handleAskAi = () => {
    if (!query) return;
    setIsAiLoading(true);
    setAiResponse(null);
    setTimeout(() => {
      const answer = getAiAnswer(query) || "No policy documents directly match your query. Try searching for topics like 'pothole SLA', 'water leak routing', 'integrity vault security', or 'how to report'.";
      setAiResponse(answer);
      setIsAiLoading(false);
    }, 600);
  };

  const filteredItems = items.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const matchedIssues = query.length >= 2
    ? issues.filter(
        (issue) =>
          issue.title.toLowerCase().includes(query.toLowerCase()) ||
          issue.id.toLowerCase().includes(query.toLowerCase()) ||
          issue.address.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const totalResultsCount = filteredItems.length + matchedIssues.length;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (totalResultsCount || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalResultsCount) % (totalResultsCount || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Handle selection
      if (filteredItems.length > 0 && selectedIndex < filteredItems.length) {
        filteredItems[selectedIndex].action();
        onClose();
      } else {
        const issueIdx = selectedIndex - filteredItems.length;
        if (matchedIssues[issueIdx]) {
          onSelectIssue(matchedIssues[issueIdx]);
          onClose();
        }
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, selectedIndex, filteredItems, matchedIssues]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-xl" onClick={onClose} />

      {/* Palette Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl glass-panel shadow-2xl flex flex-col max-h-[60vh] animate-[fadeIn_0.15s_ease-out]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-4">
          <Search className="h-5 w-5 text-foreground/60 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-sm text-foreground placeholder-gray-500 outline-none"
            placeholder="Search commands, active issues, or ask AI about policies (e.g. 'pothole SLA')..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
              setAiResponse(null);
            }}
          />
          {query.length > 0 && (
            <button
              onClick={handleAskAi}
              className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded bg-[#00F2FE]/15 border border-[#00F2FE]/30 text-[#00F2FE] hover:bg-[#00F2FE]/25 transition shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Ask AI Policy</span>
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface/5 border border-border-subtle hover:border-foreground/20 text-[9px] text-foreground/60 uppercase font-mono">
            ESC
          </kbd>
        </div>

        {/* Dynamic Display Area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* AI Response Display */}
          {isAiLoading && (
            <div className="p-4 mx-2 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-center gap-3 animate-pulse">
              <div className="w-4 h-4 border-2 border-[#00F2FE] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-indigo-300 font-mono">Consulting CivicAI Policy Database...</p>
            </div>
          )}

          {aiResponse && (
            <div className="p-4 mx-2 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900/40 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00F2FE] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> CivicAI Knowledge Engine
                </span>
                <span className="text-[9px] text-gray-500">Instant Verification</span>
              </div>
              <p className="text-xs leading-relaxed text-foreground/80 font-sans">{aiResponse}</p>
            </div>
          )}

          {/* Matches List */}
          <div className="space-y-1">
            {/* Filtered Commands */}
            {filteredItems.length > 0 && (
              <div>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1.5">
                  Platform Operations
                </p>
                {filteredItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition-all ${
                        isSelected
                          ? "bg-surface/5 text-foreground border-l-2 border-[#00F2FE]"
                          : "text-foreground/60 hover:bg-surface/5 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                        {item.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Matching Issues */}
            {matchedIssues.length > 0 && (
              <div className="mt-2">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1.5">
                  Matching Active Tickets ({matchedIssues.length})
                </p>
                {matchedIssues.map((issue, idx) => {
                  const itemIndex = filteredItems.length + idx;
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <button
                      key={issue.id}
                      onClick={() => {
                        onSelectIssue(issue);
                        onClose();
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition-all ${
                        isSelected
                          ? "bg-surface/5 text-foreground border-l-2 border-[#00F2FE]"
                          : "text-foreground/60 hover:bg-surface/5 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-ashoka-navy dark:text-ashoka-navy shrink-0" />
                        <span className="font-mono text-ashoka-navy dark:text-ashoka-navy shrink-0">{issue.id}</span>
                        <span className="truncate text-foreground/80">{issue.title}</span>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono ${
                          issue.status === "resolved"
                            ? "bg-emerald-950 text-india-green"
                            : issue.status === "in_progress"
                            ? "bg-amber-950 text-amber-400"
                            : "bg-rose-950 text-rose-400"
                        }`}
                      >
                        {issue.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {totalResultsCount === 0 && !isAiLoading && (
              <div className="py-8 text-center text-foreground/60 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs">No shortcuts or matching tickets found.</p>
                <p className="text-[10px] text-gray-500">
                  Try asking the AI Policy Assistant above by clicking "Ask AI Policy"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer shortcuts helper */}
        <div className="border-t border-border-subtle px-4 py-2.5 bg-surface/50 flex items-center justify-between text-[10px] text-foreground/60 font-mono">
          <div className="flex items-center gap-3">
            <span>&darr;&uarr; Navigate</span>
            <span>&crarr; Select</span>
          </div>
          <span>Press ESC to Close</span>
        </div>
      </div>
    </div>
  );
}
