import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import type { User, CivicIssue, Language, IssueStatus } from "./types.ts";
import { setGlobalLanguage } from "./lib/i18n.ts";
import { fetchIssues as apiFetchIssues, updateIssueStatus } from "./lib/api.ts";
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
    try {
      const data = await apiFetchIssues();
      setIssues(data.issues || []);
    } catch (e) {
      console.error("Failed to fetch issues", e);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
    const interval = setInterval(fetchIssues, 25000);
    return () => clearInterval(interval);
  }, [fetchIssues]);

  const handleIssueUpdated = (updated: CivicIssue) => {
    setSelectedIssue(updated);
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
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
    try {
      // For now, the API only takes status and notes. 
      // If we want to assign department and SLA we might need a separate endpoint or update the status endpoint.
      // We updated the status endpoint in server.ts to handle 'status' and 'notes'.
      const data = await updateIssueStatus(issueId, status, comment);
      const updated = data.issue;
      setIssues((previous) => previous.map((issue) => issue.id === issueId ? updated : issue));
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  useEffect(() => {
    localStorage.setItem("civicai-language", language);
    document.documentElement.lang = language;
    setGlobalLanguage(language);
  }, [language]);

  // Derived state for Header
  const activePortalTab = location.pathname.includes("/admin/dashboard")
    ? "authority"
    : location.pathname.includes("/integrity")
      ? "integrity"
      : location.pathname.includes("/field-officer")
        ? "officer"
        : location.pathname.includes("/analytics")
          ? "analytics"
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
               else if (tab === "integrity") navigate("/integrity");
               else if (tab === "officer") navigate("/field-officer");
               else if (tab === "analytics") navigate("/analytics");
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
          <Route path="/integrity" element={
            <IntegrityPortal currentUser={currentUser || DEFAULT_MOCK_USER} language={language} />
          } />
          <Route path="/field-officer" element={
            <FieldOfficerPortal 
              currentUser={currentUser || DEFAULT_MOCK_USER} 
              issues={issues}
              onSelectIssue={setSelectedIssue}
              onRefreshIssues={fetchIssues}
              language={language}
            />
          } />
          <Route path="/analytics" element={
            <AnalyticsDashboard 
              issues={issues}
              onSelectIssue={setSelectedIssue}
              language={language}
            />
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