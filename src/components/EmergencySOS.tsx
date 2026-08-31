import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Shield,
  Heart,
  ShieldAlert,
  Users,
  X,
  Phone,
  AlertTriangle,
  ChevronRight,
  Lock,
  Wifi,
  Brain,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ═══════════════════════════════════════════════════════
// 🚨 EMERGENCY CATEGORY DEFINITIONS
// Zero-latency crisis intervention — tel: links fire on first tap
// ═══════════════════════════════════════════════════════

interface EmergencyNumber {
  label: string;
  number: string;
  tel: string; // tel: URI
}

interface EmergencyCategory {
  id: "police" | "medical" | "assault" | "ragging" | "cyber" | "mental";
  titleKey: string;
  descKey: string;
  icon: typeof Shield;
  cardClass: string;
  btnClass: string;
  accentColor: string;
  primaryNumbers: EmergencyNumber[];
  secondaryNumbers: EmergencyNumber[];
  safetyStepKeys: string[];
  affirmationKey?: string; // Trauma-informed validation message
}

const EMERGENCY_CATEGORIES: EmergencyCategory[] = [
  {
    id: "police",
    titleKey: "activeDangerTitle",
    descKey: "activeDangerDesc",
    icon: Shield,
    cardClass: "sos-card sos-card-danger",
    btnClass: "sos-call-btn sos-call-btn-danger",
    accentColor: "#EF4444",
    primaryNumbers: [
      { label: "112", number: "112", tel: "tel:112" },
      { label: "100", number: "100", tel: "tel:100" },
      { label: "911", number: "911", tel: "tel:911" },
    ],
    secondaryNumbers: [
      { label: "🔥 101", number: "101", tel: "tel:101" },
    ],
    safetyStepKeys: ["activeDangerStep1", "activeDangerStep2"],
  },
  {
    id: "medical",
    titleKey: "medicalTitle",
    descKey: "medicalDesc",
    icon: Heart,
    cardClass: "sos-card sos-card-medical",
    btnClass: "sos-call-btn sos-call-btn-medical",
    accentColor: "#10B981",
    primaryNumbers: [
      { label: "102", number: "102", tel: "tel:102" },
      { label: "108", number: "108", tel: "tel:108" },
      { label: "911", number: "911", tel: "tel:911" },
    ],
    secondaryNumbers: [
      { label: "🛣️ 1033", number: "1033", tel: "tel:1033" },
      { label: "🚂 139", number: "139", tel: "tel:139" },
    ],
    safetyStepKeys: ["medicalStep1", "medicalStep2"],
  },
  {
    id: "assault",
    titleKey: "assaultTitle",
    descKey: "assaultDesc",
    icon: ShieldAlert,
    cardClass: "sos-card sos-card-assault",
    btnClass: "sos-call-btn sos-call-btn-assault",
    accentColor: "#A855F7",
    primaryNumbers: [
      { label: "1091", number: "1091", tel: "tel:1091" },
      { label: "181", number: "181", tel: "tel:181" },
    ],
    secondaryNumbers: [
      { label: "NCW 14490", number: "14490", tel: "tel:14490" },
      { label: "112", number: "112", tel: "tel:112" },
    ],
    safetyStepKeys: ["assaultStep1", "assaultStep2", "assaultStep3"],
    affirmationKey: "safeNow",
  },
  {
    id: "ragging",
    titleKey: "raggingTitle",
    descKey: "raggingDesc",
    icon: Users,
    cardClass: "sos-card sos-card-ragging",
    btnClass: "sos-call-btn sos-call-btn-ragging",
    accentColor: "#3B82F6",
    primaryNumbers: [
      {
        label: "1800-180-5522",
        number: "1800-180-5522",
        tel: "tel:18001805522",
      },
    ],
    secondaryNumbers: [
      { label: "👶 1098", number: "1098", tel: "tel:1098" },
      { label: "112", number: "112", tel: "tel:112" },
    ],
    safetyStepKeys: ["raggingStep1", "raggingStep2"],
    affirmationKey: "notAlone",
  },
  {
    id: "cyber",
    titleKey: "cyberTitle",
    descKey: "cyberDesc",
    icon: Wifi,
    cardClass: "sos-card sos-card-cyber",
    btnClass: "sos-call-btn sos-call-btn-cyber",
    accentColor: "#F59E0B",
    primaryNumbers: [
      { label: "1930", number: "1930", tel: "tel:1930" },
    ],
    secondaryNumbers: [
      { label: "112", number: "112", tel: "tel:112" },
    ],
    safetyStepKeys: ["cyberStep1", "cyberStep2"],
    affirmationKey: "cyberAffirm",
  },
  {
    id: "mental",
    titleKey: "mentalTitle",
    descKey: "mentalDesc",
    icon: Brain,
    cardClass: "sos-card sos-card-mental",
    btnClass: "sos-call-btn sos-call-btn-mental",
    accentColor: "#14B8A6",
    primaryNumbers: [
      {
        label: "1800-599-0019",
        number: "1800-599-0019",
        tel: "tel:18005990019",
      },
    ],
    secondaryNumbers: [
      { label: "👴 14567", number: "14567", tel: "tel:14567" },
    ],
    safetyStepKeys: ["mentalStep1", "mentalStep2"],
    affirmationKey: "mentalAffirm",
  },
];

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

export default function EmergencySOS() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap: when modal opens, focus the close button
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Escape key closes modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setExpandedCategory(null);
      }
    },
    [isOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCategoryClick = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleCallNow = (tel: string) => {
    // ZERO DELAY — fire tel: link immediately
    window.location.href = tel;
  };

  return (
    <>
      {/* ─── FLOATING SOS BUTTON ─── */}
      <button
        className="sos-fab"
        onClick={() => setIsOpen(true)}
        aria-label={t("emergencySOS")}
        title={t("emergencySOS")}
        id="sos-fab-trigger"
      >
        <AlertTriangle className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* ─── FULL-SCREEN EMERGENCY OVERLAY ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={overlayRef}
            className="sos-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-label={t("emergencyAction")}
          >
            <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-5">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 200, damping: 20 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      🚨 {t("emergencyAction")}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <Lock className="w-3 h-3" />
                      {t("immediateSteps")}
                    </p>
                  </div>
                </div>

                <button
                  ref={closeButtonRef}
                  onClick={() => {
                    setIsOpen(false);
                    setExpandedCategory(null);
                  }}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  aria-label={t("closeEmergency")}
                  id="sos-close-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>

              {/* Safety banner */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3"
              >
                <p className="text-xs sm:text-sm text-red-300 font-semibold leading-relaxed">
                  <span className="font-black">1.</span> {t("activeDangerStep1")}{" "}
                  <span className="font-black">2.</span> {t("tapToCall")} ↓
                </p>
              </motion.div>

              {/* Emergency Category Cards */}
              <div className="flex flex-col gap-3">
                {EMERGENCY_CATEGORIES.map((cat, idx) => {
                  const IconComp = cat.icon;
                  const isExpanded = expandedCategory === cat.id;

                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.12 + idx * 0.06,
                        type: "spring",
                        stiffness: 180,
                        damping: 18,
                      }}
                    >
                      <div className={cat.cardClass} id={`sos-card-${cat.id}`}>
                        {/* Card header — tap to expand */}
                        <button
                          className="w-full flex items-center gap-3 text-left cursor-pointer bg-transparent border-none p-0"
                          onClick={() => handleCategoryClick(cat.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`sos-details-${cat.id}`}
                        >
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              background: `${cat.accentColor}15`,
                              border: `1px solid ${cat.accentColor}30`,
                            }}
                          >
                            <IconComp
                              className="w-5 h-5"
                              style={{ color: cat.accentColor }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-extrabold text-sm sm:text-base text-white truncate"
                            >
                              {t(cat.titleKey)}
                            </h3>
                            <p className="text-[11px] text-slate-400 truncate">
                              {t(cat.descKey)}
                            </p>
                          </div>

                          {/* Primary call buttons — ALWAYS visible, zero depth */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {cat.primaryNumbers.map((num) => (
                              <a
                                key={num.number}
                                href={num.tel}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCallNow(num.tel);
                                }}
                                className={cat.btnClass}
                                style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem" }}
                                aria-label={`${t("tapToCall")} ${num.label}`}
                                id={`sos-call-${cat.id}-${num.number}`}
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{num.label}</span>
                              </a>
                            ))}
                          </div>

                          <ChevronRight
                            className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </button>

                        {/* Expanded detail panel */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              id={`sos-details-${cat.id}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                                {/* Affirmation message (trauma-informed) */}
                                {cat.affirmationKey && (
                                  <div
                                    className="rounded-lg px-3 py-2.5"
                                    style={{
                                      background: `${cat.accentColor}10`,
                                      border: `1px solid ${cat.accentColor}25`,
                                    }}
                                  >
                                    <p
                                      className="text-sm font-bold leading-snug"
                                      style={{ color: cat.accentColor }}
                                    >
                                      ❤ {t(cat.affirmationKey)}
                                    </p>
                                  </div>
                                )}

                                {/* Safety Steps */}
                                <div>
                                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">
                                    {t("immediateSteps")}
                                  </h4>
                                  <ol className="space-y-1.5">
                                    {cat.safetyStepKeys.map((stepKey, i) => (
                                      <li
                                        key={stepKey}
                                        className="flex items-start gap-2 text-xs sm:text-sm text-slate-300 leading-relaxed"
                                      >
                                        <span
                                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
                                          style={{
                                            background: `${cat.accentColor}20`,
                                            color: cat.accentColor,
                                          }}
                                        >
                                          {i + 1}
                                        </span>
                                        {t(stepKey)}
                                      </li>
                                    ))}
                                  </ol>
                                </div>

                                {/* Secondary call actions */}
                                {cat.secondaryNumbers.length > 0 && (
                                  <div>
                                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">
                                      {t("alsoCall")}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {cat.secondaryNumbers.map((num) => (
                                        <a
                                          key={num.number}
                                          href={num.tel}
                                          onClick={() => handleCallNow(num.tel)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                                          id={`sos-secondary-${cat.id}-${num.number}`}
                                        >
                                          <Phone className="w-3 h-3" />
                                          {num.label}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Privacy Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-2 text-[10px] text-slate-600 mt-2"
              >
                <Lock className="w-3 h-3" />
                <span>
                  All interactions are private. No data is logged or stored.
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
