import { Shield, Sparkles, User, Bell, ChevronDown, Check } from "lucide-react";
import type { UserRole, User as UserType } from "../types.ts";

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUser: UserType;
  allUsers: UserType[];
  onUserSelect: (user: UserType) => void;
  activePortalTab: "citizen" | "integrity" | "authority" | "officer" | "analytics";
  onPortalTabChange: (tab: "citizen" | "integrity" | "authority" | "officer" | "analytics") => void;
}

export default function Header({
  currentRole,
  onRoleChange,
  currentUser,
  allUsers,
  onUserSelect,
  activePortalTab,
  onPortalTabChange,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#151921] backdrop-blur-md border-b border-[#2D3139]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <span className="font-bold text-white text-xl">C</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-[#F3F4F6] flex items-center">
                  Civic<span className="text-blue-500">AI</span>
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v2.5
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                AI-Assisted Civic Accountability & Integrity Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation Portals */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#0F1115] p-1.5 rounded-xl border border-[#2D3139]">
            <button
              onClick={() => {
                onPortalTabChange("citizen");
                onRoleChange("citizen");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                activePortalTab === "citizen"
                  ? "bg-[#1E2229] text-blue-400 border border-blue-500/20 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#1E2229]/50"
              }`}
            >
              {activePortalTab === "citizen" && <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>}
              <span>Citizen Portal</span>
            </button>
            <button
              onClick={() => {
                onPortalTabChange("integrity");
                onRoleChange("investigator");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                activePortalTab === "integrity"
                  ? "bg-[#1E2229] text-red-400 border border-red-500/30 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#1E2229]/50"
              }`}
            >
              {activePortalTab === "integrity" && <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>}
              <span>Integrity Portal</span>
              <div className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[9px] font-bold">SECURE</div>
            </button>
            <button
              onClick={() => {
                onPortalTabChange("authority");
                onRoleChange("admin");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                activePortalTab === "authority"
                  ? "bg-[#1E2229] text-blue-400 border border-blue-500/20 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#1E2229]/50"
              }`}
            >
              {activePortalTab === "authority" && <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>}
              <span>Admin Dashboard</span>
            </button>
            <button
              onClick={() => {
                onPortalTabChange("officer");
                onRoleChange("officer");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                activePortalTab === "officer"
                  ? "bg-[#1E2229] text-emerald-400 border border-emerald-500/20 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#1E2229]/50"
              }`}
            >
              {activePortalTab === "officer" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}
              <span>Field Operations</span>
            </button>
            <button
              onClick={() => onPortalTabChange("analytics")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                activePortalTab === "analytics"
                  ? "bg-[#1E2229] text-amber-400 border border-amber-500/20 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#1E2229]/50"
              }`}
            >
              {activePortalTab === "analytics" && <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>}
              <span>System Analytics</span>
            </button>
          </nav>

          {/* System Status & User Persona Selector */}
          <div className="flex items-center gap-3">
            {/* System Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 bg-[#1E2229] px-3 py-1.5 rounded-lg border border-[#2D3139]">
              <span className="text-xs text-gray-400">System Status:</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Operational</span>
            </div>

            {/* Persona Switcher Menu */}
            <div className="relative group">
              <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#1E2229] hover:bg-[#252a33] border border-[#2D3139] text-xs font-medium text-gray-200 transition">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-blue-500/50"
                />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-[#F3F4F6] leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-blue-400 capitalize">{currentUser.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {/* Dropdown for instant RBAC switching */}
              <div className="absolute right-0 mt-2 w-64 bg-[#1E2229] border border-[#2D3139] rounded-xl shadow-2xl p-2 hidden group-hover:block z-50 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 py-1.5">
                  Switch Persona & Role
                </div>
                <div className="space-y-1">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onUserSelect(u);
                        onRoleChange(u.role);
                        if (u.role === "citizen") onPortalTabChange("citizen");
                        else if (u.role === "admin") onPortalTabChange("authority");
                        else if (u.role === "officer") onPortalTabChange("officer");
                        else if (u.role === "investigator") onPortalTabChange("integrity");
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                        currentUser.id === u.id
                          ? "bg-[#151921] text-white font-semibold border border-blue-500/30"
                          : "text-gray-300 hover:bg-[#151921]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                        <div className="text-left">
                          <div className="text-xs font-bold">{u.name}</div>
                          <div className="text-[10px] text-blue-400 capitalize">{u.role}</div>
                        </div>
                      </div>
                      {currentUser.id === u.id && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
