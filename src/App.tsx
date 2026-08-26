import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import type { User, CivicIssue, Language, IssueStatus } from "./types.ts";
import { setGlobalLanguage } from "./lib/i18n.ts";
import { loadDemoReports, updateDemoReport } from "./lib/demoStorage.ts";
import { ThemeProvider } from "./lib/ThemeContext.tsx";

import Header from "./components/Header.tsx";
import CitizenPortal from "./components/CitizenPortal.tsx";
import IntegrityPortal from "./components/IntegrityPortal.tsx";
import AuthorityDashboard from "./components/AuthorityDashboard.tsx";
import { AdminErrorBoundary } from "./components/AdminErrorBoundary.tsx";
import FieldOfficerPortal from "./components/FieldOfficerPortal.tsx";
import AnalyticsDashboard from "./components/AnalyticsDashboard.tsx";
import IssueDetailModal from "./components/IssueDetailModal.tsx";
import { VoiceCommandButton } from "./components/VoiceControls.tsx";
import LandingPage from "./components/LandingPage.tsx";
import InteractiveBackground from "./components/InteractiveBackground.tsx";
import AdminLogin from "./components/AdminLogin.tsx";
import CommandPalette from "./components/CommandPalette.tsx";
import LoginPage from "./components/LoginPage.tsx";
import RegisterPage from "./components/RegisterPage.tsx";

const DEFAULT_MOCK_USER: User = {
  id: "usr-citizen-01",
  name: "CivicAI Citizen",
  email: "citizen@civicai.local",
  phone: "+15550000001",
  role: "citizen",
  tenantId: "municipality-sf",
  reputationScore: 100,
  createdAt: "2026-01-01T00:00:00.000Z",
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("civicai-language");
    return (savedLanguage === "hi" || savedLanguage === "es" || savedLanguage === "fr" || savedLanguage === "zh" || savedLanguage === "bn")
      ? savedLanguage
      : "en";
  });
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Restore session
  useEffect(() => {
    const userJson = localStorage.getItem("civicai-user");
    if (userJson) {
      try {
        setCurrentUser(JSON.parse(userJson));
      } catch (e) {
        localStorage.removeItem("civicai-user");
        localStorage.removeItem("civicai-token");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("civicai-token");
    localStorage.removeItem("civicai-user");
    setCurrentUser(null);
    navigate("/");
  };

  const fetchIssues = useCallback(async () => {
    setIssues(loadDemoReports());
  }, []);

  useEffect(() => {
    fetchIssues();
    const interval = setInterval(fetchIssues, 25000);
    return () => clearInterval(interval);
  }, [fetchIssues]);

  const handleIssueUpdated = (updated: CivicIssue) => {
    setSelectedIssue(updated);
    setIssues((prev) => updateDemoReport(updated).length ? prev.map((i) => (i.id === updated.id ? updated : i)) : prev);
  };

  const handleReportCreated = (report: CivicIssue) => {
    setIssues((previous) => [report, ...previous.filter((issue) => issue.id !== report.id)]);
  };

  const handleUpdateStatus = async (
    issueId: string,
    status: IssueStatus,
    comment?: string,
    assignedDepartment?: string,
    slaHours?: number
  ) => {
    const existing = loadDemoReports().find((issue) => issue.id === issueId);
    if (!existing) return;
    const updated: CivicIssue = {
      ...existing,
      status,
      assignedDepartment: assignedDepartment || existing.assignedDepartment,
      slaHours: slaHours || existing.slaHours,
      resolutionNotes: status === "resolved" ? comment || existing.resolutionNotes : existing.resolutionNotes,
      updatedAt: new Date().toISOString(),
    };
    updateDemoReport(updated);
    setIssues((previous) => previous.map((issue) => issue.id === issueId ? updated : issue));
  };

  useEffect(() => {
    localStorage.setItem("civicai-language", language);
    document.documentElement.lang = language;
    setGlobalLanguage(language);
  }, [language]);

  // Derived state for Header
  const activePortalTab = location.pathname.includes("/admin/dashboard")
    ? "authority"
    : location.pathname.includes("/dashboard")
      ? "citizen"
      : "citizen";

  return (
    <div key={language} className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-50 flex flex-col relative transition-colors duration-300">
      {/* We conditionally render Header on routes that aren't landing/auth */}
      {location.pathname !== "/" && location.pathname !== "/login" && location.pathname !== "/register" && location.pathname !== "/admin/login" && (
         <Header
            currentUser={currentUser || DEFAULT_MOCK_USER}
            activePortalTab={activePortalTab as any}
            onPortalTabChange={(tab) => {
               if (tab === "authority") navigate("/admin/dashboard");
               else navigate("/dashboard");
            }}
            language={language}
            onLanguageChange={setLanguage}
            onLogout={handleLogout}
         />
      )}

      <main data-localize-root="true" className="flex-1 relative z-10">
        <Routes>
          <Route path="/" element={<LandingPage onSelectRole={(role) => navigate(role === "admin" ? "/admin/login" : "/login")} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLogin onLogin={() => {
            const mockAdminUser: User = { ...DEFAULT_MOCK_USER, role: "admin", name: "CivicAI Admin", id: "usr-admin-01" };
            localStorage.setItem("civicai-user", JSON.stringify(mockAdminUser));
            setCurrentUser(mockAdminUser);
            navigate("/admin/dashboard");
          }} onBack={() => navigate("/")} />} />
          
          <Route path="/dashboard" element={
            <CitizenPortal
              currentUser={currentUser || DEFAULT_MOCK_USER}
              language={language}
              onOpenIntegrity={() => navigate("/integrity")}
              onSelectIssue={setSelectedIssue}
              issues={issues}
              onRefreshIssues={fetchIssues}
              onReportCreated={handleReportCreated}
              voiceOpenReport={0}
            />
          } />
          
          <Route path="/admin/dashboard" element={
            <AdminErrorBoundary>
              <AuthorityDashboard
                issues={issues}
                currentUser={currentUser || DEFAULT_MOCK_USER}
                language={language}
                onUpdateStatus={handleUpdateStatus}
                onSelectIssue={setSelectedIssue}
                onRefreshIssues={fetchIssues}
              />
            </AdminErrorBoundary>
          } />
        </Routes>
      </main>

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          currentUser={currentUser || DEFAULT_MOCK_USER}
          language={language}
          onClose={() => setSelectedIssue(null)}
          onIssueUpdated={handleIssueUpdated}
        />
      )}
      
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectPortal={() => {}}
        onSelectIssue={setSelectedIssue}
        issues={issues}
        language={language}
        onLanguageChange={setLanguage}
      />
    </div>
  );
}