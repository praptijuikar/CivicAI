import { useTranslation } from "react-i18next";
import { ShieldCheck, LogOut, Search, Compass, ShieldAlert, Sparkles, Terminal, Sun, Moon } from "lucide-react";
import { useTheme } from "../lib/ThemeContext.tsx";
import type { Language, User as UserType } from "../types.ts";
import { languages, translate } from "../lib/i18n.ts";

interface HeaderProps {
  currentUser: UserType;
  activePortalTab: "citizen" | "integrity" | "threats" | "authority" | "officer" | "analytics";
  onPortalTabChange: (tab: "citizen" | "integrity" | "threats" | "authority" | "officer" | "analytics") => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onLogout: () => void;
}

export default function Header({
  currentUser,
  activePortalTab,
  onPortalTabChange,
  language,
  onLanguageChange,
  onLogout,
}: HeaderProps) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const triggerSearch = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F2FE] to-[#6366F1] flex items-center justify-center shadow-lg shadow-[#00F2FE]/10">
              <span className="font-extrabold text-slate-950 text-xl">C</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg tracking-tight text-slate-900 dark:text-white flex items-center">
                  Civic<span className="gradient-text-cyan-indigo font-bold">AI</span>
                </h1>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100/5 border border-slate-200 dark:border-slate-700 text-[#00F2FE]">
                  v2.5
                </span>
              </div>
              <p className="text-[10px] text-slate-900/60 dark:text-slate-400 hidden sm:block font-medium">
                {translate(language, "platformDescription")}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Portals */}
          <nav className="hidden md:flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {currentUser.role === "citizen" && (
              <button
                onClick={() => onPortalTabChange("citizen")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activePortalTab === "citizen"
                    ? "bg-slate-100/10 text-[#00F2FE] border border-[#00F2FE]/20 shadow-sm"
                    : "text-slate-900/60 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {activePortalTab === "citizen" && <div className="w-1.5 h-1.5 rounded-full bg-[#00F2FE]" />}
                <span>{translate(language, "citizenPortal")}</span>
              </button>
            )}

            {/* Cyber Threat Module Portal Tab */}
            <button
              onClick={() => onPortalTabChange("threats")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activePortalTab === "threats"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/20 font-black"
                  : "text-slate-900/60 dark:text-slate-400 hover:text-cyan-400"
              }`}
            >
              {activePortalTab === "threats" && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
              <span>Cyber Threat Shield</span>
              <span className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 px-1 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider font-mono">
                1930
              </span>
            </button>

            {currentUser.role === "citizen" && (
              <button
                onClick={() => onPortalTabChange("integrity")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activePortalTab === "integrity"
                    ? "bg-slate-100/10 text-rose-400 border border-rose-500/20 shadow-sm"
                    : "text-slate-900/60 dark:text-slate-400 hover:text-rose-400"
                }`}
              >
                {activePortalTab === "integrity" && <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
                <span>{translate(language, "integrityPortal")}</span>
                <span className="bg-rose-500/10 text-rose-400 px-1 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider">
                  {translate(language, "secure")}
                </span>
              </button>
            )}

            {currentUser.role === "admin" && (
              <button
                onClick={() => onPortalTabChange("authority")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activePortalTab === "authority"
                    ? "bg-slate-100/10 text-[#00F2FE] border border-[#00F2FE]/20 shadow-sm"
                    : "text-slate-900/60 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {activePortalTab === "authority" && <div className="w-1.5 h-1.5 rounded-full bg-[#00F2FE]" />}
                <span>{translate(language, "adminDashboard")}</span>
              </button>
            )}

            {currentUser.role === "admin" && (
              <button
                onClick={() => onPortalTabChange("officer")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activePortalTab === "officer"
                    ? "bg-slate-100/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                    : "text-slate-900/60 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {activePortalTab === "officer" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                <span>{translate(language, "fieldOperations")}</span>
              </button>
            )}

            {currentUser.role === "admin" && (
              <button
                onClick={() => onPortalTabChange("analytics")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activePortalTab === "analytics"
                    ? "bg-slate-100/10 text-amber-400 border border-amber-500/20 shadow-sm"
                    : "text-slate-900/60 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {activePortalTab === "analytics" && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                <span>{translate(language, "systemAnalytics")}</span>
              </button>
            )}
          </nav>

          {/* Right Section elements */}
          <div className="flex items-center gap-3">
            {/* Global Palette Search Trigger */}
            <button
              onClick={triggerSearch}
              className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-900/60 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('Search')}</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[9px] text-gray-500 uppercase font-mono">
                ⌘K
              </kbd>
            </button>

            {/* System Status Indicators */}
            <div className="hidden lg:flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="w-2 h-2 rounded-full bg-[#00F2FE] animate-pulse"></div>
              <span className="text-[10px] font-bold text-[#00F2FE] uppercase tracking-wider">
                {translate(language, "operational")}
              </span>
            </div>

            {/* Language Switcher */}
            <label className="hidden sm:flex items-center gap-1">
              <select
                value={language}
                onChange={(event) => onLanguageChange(event.target.value as Language)}
                aria-label={translate(language, "language")}
                className="h-8 max-w-24 cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs font-semibold text-slate-900/80 dark:text-slate-200 outline-none transition hover:border-[#00F2FE]/50"
              >
                {languages.map((option) => (
                  <option key={option.code} value={option.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                    {option.nativeLabel}
                  </option>
                ))}
              </select>
            </label>

            {/* User Persona Profile */}
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-3 py-1.5 backdrop-blur-md">
              <ShieldCheck className="h-5 w-5 text-[#00F2FE]" />
              <div className="hidden text-left sm:block">
                <div className="text-xs font-bold leading-tight text-slate-900 dark:text-white">{currentUser.name}</div>
                <div className="text-[9px] capitalize text-[#00F2FE] font-mono tracking-wider">{currentUser.role}</div>
              </div>
              <button
                onClick={onLogout}
                aria-label="Sign out"
                title="Sign out"
                className="rounded-lg p-1.5 text-slate-900/60 dark:text-slate-400 transition hover:text-rose-400 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </header>
  );
}
