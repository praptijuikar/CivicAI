import { useState, useEffect, useCallback } from "react";
import type { User, UserRole, CivicIssue, Language } from "./types.ts";
import { api } from "./lib/api.ts";
import { translate } from "./lib/i18n.ts";
import Header from "./components/Header.tsx";
import CitizenPortal from "./components/CitizenPortal.tsx";
import IntegrityPortal from "./components/IntegrityPortal.tsx";
import AuthorityDashboard from "./components/AuthorityDashboard.tsx";
import FieldOfficerPortal from "./components/FieldOfficerPortal.tsx";
import AnalyticsDashboard from "./components/AnalyticsDashboard.tsx";
import IssueDetailModal from "./components/IssueDetailModal.tsx";

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("citizen");
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("civicai-language");
    return savedLanguage === "hi" || savedLanguage === "es" || savedLanguage === "bn" ? savedLanguage : "en";
  });
  const [activePortalTab, setActivePortalTab] = useState<
    "citizen" | "integrity" | "authority" | "officer" | "analytics"
  >("citizen");

  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);

  // Load initial users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.getUsers();
        setUsers(res.users);
        if (res.users.length > 0) {
          setCurrentUser(res.users[0]);
          setCurrentRole(res.users[0].role);
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    };
    fetchUsers();
  }, []);

  // Fetch all issues
  const fetchIssues = useCallback(async () => {
    try {
      const res = await api.getIssues();
      setIssues(res.issues);
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    } finally {
      setIsLoadingIssues(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
    const interval = setInterval(fetchIssues, 25000); // Polling every 25 seconds
    return () => clearInterval(interval);
  }, [fetchIssues]);

  const handleUserSelect = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
  };

  const handleIssueUpdated = (updated: CivicIssue) => {
    setSelectedIssue(updated);
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  useEffect(() => {
    localStorage.setItem("civicai-language", language);
    document.documentElement.lang = language;
  }, [language]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center text-gray-400 space-y-3">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono font-semibold">Booting CivicAI Security Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#F3F4F6] flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Global Application Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentUser={currentUser}
        allUsers={users}
        onUserSelect={handleUserSelect}
        activePortalTab={activePortalTab}
        onPortalTabChange={setActivePortalTab}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Main View Portals */}
      <main className="flex-1">
        {activePortalTab === "citizen" && (
          <CitizenPortal
            currentUser={currentUser}
            onOpenIntegrity={() => {
              setActivePortalTab("integrity");
              setCurrentRole("investigator");
            }}
            onSelectIssue={setSelectedIssue}
            issues={issues}
            onRefreshIssues={fetchIssues}
          />
        )}

        {activePortalTab === "integrity" && (
          <IntegrityPortal currentUser={currentUser} />
        )}

        {activePortalTab === "authority" && (
          <AuthorityDashboard
            currentUser={currentUser}
            issues={issues}
            onSelectIssue={setSelectedIssue}
            onRefreshIssues={fetchIssues}
          />
        )}

        {activePortalTab === "officer" && (
          <FieldOfficerPortal
            currentUser={currentUser}
            issues={issues}
            onSelectIssue={setSelectedIssue}
            onRefreshIssues={fetchIssues}
          />
        )}

        {activePortalTab === "analytics" && (
          <AnalyticsDashboard issues={issues} onSelectIssue={setSelectedIssue} />
        )}
      </main>

      {/* Geometric Balance Platform Status Footer */}
      <footer className="hidden sm:flex h-12 border-t border-[#2D3139] px-8 items-center justify-between text-[10px] text-gray-500 bg-[#151921]">
        <p>{translate(language, "footer")}</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> API: 14ms
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {translate(language, "database")}
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> {translate(language, "aiNode")}
          </span>
        </div>
      </footer>

      {/* Modal: Deep Issue Lifecycle & Verification */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          currentUser={currentUser}
          onClose={() => setSelectedIssue(null)}
          onIssueUpdated={handleIssueUpdated}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#151921]/95 border-t border-[#2D3139] backdrop-blur-lg px-2 py-1.5 flex items-center justify-around text-[10px] font-semibold">
        <button
          onClick={() => {
            setActivePortalTab("citizen");
            setCurrentRole("citizen");
          }}
          className={`flex flex-col items-center p-1.5 rounded-lg transition ${activePortalTab === "citizen" ? "text-blue-400 font-bold" : "text-gray-400"
            }`}
        >
          <span>{translate(language, "citizen")}</span>
        </button>
        <button
          onClick={() => {
            setActivePortalTab("integrity");
            setCurrentRole("investigator");
          }}
          className={`flex flex-col items-center p-1.5 rounded-lg transition ${activePortalTab === "integrity" ? "text-red-400 font-bold" : "text-gray-400"
            }`}
        >
          <span>{translate(language, "vault")}</span>
        </button>
        <button
          onClick={() => {
            setActivePortalTab("authority");
            setCurrentRole("admin");
          }}
          className={`flex flex-col items-center p-1.5 rounded-lg transition ${activePortalTab === "authority" ? "text-blue-400 font-bold" : "text-gray-400"
            }`}
        >
          <span>{translate(language, "admin")}</span>
        </button>
        <button
          onClick={() => {
            setActivePortalTab("officer");
            setCurrentRole("officer");
          }}
          className={`flex flex-col items-center p-1.5 rounded-lg transition ${activePortalTab === "officer" ? "text-emerald-400 font-bold" : "text-gray-400"
            }`}
        >
          <span>{translate(language, "field")}</span>
        </button>
        <button
          onClick={() => setActivePortalTab("analytics")}
          className={`flex flex-col items-center p-1.5 rounded-lg transition ${activePortalTab === "analytics" ? "text-amber-400 font-bold" : "text-gray-400"
            }`}
        >
          <span>{translate(language, "analytics")}</span>
        </button>
      </div>
    </div>
  );
}
