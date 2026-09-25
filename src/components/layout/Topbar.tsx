import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Bell,
  Sparkles,
  ShieldAlert,
  Moon,
  Sun,
  User,
  ChevronDown,
  RotateCcw,
  Check,
  Building,
  Briefcase,
  Layers,
  FileText,
  Clock,
  DollarSign,
  UserPlus,
  BookOpen,
  LogOut,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const Topbar: React.FC = () => {
  const {
    currentUser,
    switchUser,
    availableUsers,
    logout,
    settings,
    updateSettings,
    openCreateModal,
    setIsCommandPaletteOpen,
    setIsAiAssistantOpen,
    setIsAiAuditOpen,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    resetDemoData,
    navigateTo,
    currentView,
    kpis,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotifMenuOpen(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setIsCreateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    updateSettings({ theme: (settings?.theme || "dark") === "dark" ? "light" : "dark" });
  };

  const viewLabels: Record<string, string> = {
    dashboard: "System Monitor",
    crm: "Sales & Client Directory",
    projects: "Active Workstreams",
    tasks: "Task Kanban & Deliverables",
    hrm: "Resource Matrix",
    workload: "Capacity & Utilization",
    team: "Capacity & Utilization",
    documents: "Knowledge Repository",
    notes: "Executive Scratchpad",
    reports: "Compliance & Performance Reports",
    ai: "Intelligence & Automations",
    settings: "Organization & Access Control",
  };

  const isDark = settings?.theme === "dark";

  return (
    <header
      className={`h-16 sticky top-0 z-20 px-6 sm:px-8 flex items-center justify-between gap-4 transition-colors duration-200 ${
        isDark
          ? "bg-slate-900/95 border-b border-slate-800 text-white backdrop-blur-md shadow-sm"
          : "bg-white border-b border-slate-200 text-slate-900 shadow-2xs"
      }`}
    >
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-3 text-sm font-medium">
        <span className={`hidden sm:inline ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Global Workspace
        </span>
        <span className={`hidden sm:inline ${isDark ? "text-slate-600" : "text-slate-300"}`}>/</span>
        <span className={`font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
          {viewLabels[currentView] || "System Monitor"}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Input / Command Palette Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className={`flex items-center justify-between pl-9 pr-3 py-1.5 rounded-full text-xs transition-colors w-40 sm:w-60 border cursor-pointer ${
              isDark
                ? "bg-slate-800/90 hover:bg-slate-800 text-slate-300 border-slate-700/60"
                : "bg-slate-100 hover:bg-slate-200/70 text-slate-600 border-transparent"
            }`}
          >
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-400"}`} />
            <span className="truncate">Quick search...</span>
            <kbd
              className={`hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded shadow-2xs ${
                isDark
                  ? "bg-slate-700 text-slate-300 border border-slate-600"
                  : "bg-white text-slate-500 border border-slate-200"
              }`}
            >
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Global Create Button */}
        <div className="relative" ref={createMenuRef}>
          <button
            type="button"
            onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown size={12} className="text-blue-200" />
          </button>

          {isCreateDropdownOpen && (
            <div
              className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-white shadow-slate-950/60"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                Quick Actions
              </div>
              <button
                onClick={() => { openCreateModal("lead"); setIsCreateDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Briefcase size={14} className="text-blue-600" /> New Lead
              </button>
              <button
                onClick={() => { openCreateModal("deal"); setIsCreateDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <DollarSign size={14} className="text-emerald-600" /> New Deal
              </button>
              <button
                onClick={() => { openCreateModal("project"); setIsCreateDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Layers size={14} className="text-purple-600" /> New Project
              </button>
              <button
                onClick={() => { openCreateModal("task"); setIsCreateDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Clock size={14} className="text-amber-600" /> New Task
              </button>
              <div className="my-1 border-t border-slate-100"></div>
              <button
                onClick={() => { openCreateModal("employee"); setIsCreateDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <UserPlus size={14} className="text-indigo-600" /> New Employee
              </button>
              <button
                onClick={() => { openCreateModal("company"); setIsCreateDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Building size={14} className="text-teal-600" /> New Company
              </button>
              <button
                onClick={() => { openCreateModal("leave"); setIsCreateDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FileText size={14} className="text-pink-600" /> New Leave Request
              </button>
              <button
                onClick={() => { openCreateModal("note"); setIsCreateDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <BookOpen size={14} className="text-sky-600" /> New Note
              </button>
            </div>
          )}
        </div>

        {/* AI Operations Audit Button */}
        <button
          type="button"
          onClick={() => setIsAiAuditOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
          title="AI Operations Audit"
        >
          <ShieldAlert size={14} className="text-rose-600" />
          <span className="hidden md:inline">Audit</span>
          {kpis.projectsAtRisk + kpis.overdueTasks > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold">
              {kpis.projectsAtRisk + kpis.overdueTasks}
            </span>
          )}
        </button>

        {/* AI Assistant Quick Toggle */}
        <button
          type="button"
          onClick={() => setIsAiAssistantOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-semibold transition-all cursor-pointer"
        >
          <Sparkles size={14} className="text-blue-600" />
          <span className="hidden md:inline">Worqester AI</span>
        </button>

        {/* Theme Toggle Button (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
            isDark
              ? "bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700"
              : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
          }`}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications Button */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
            className={`w-8 h-8 rounded-full flex items-center justify-center relative transition-colors cursor-pointer border ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 border-slate-200"
            }`}
            title="Notifications"
          >
            <Bell size={16} />
            {unreadNotificationsCount > 0 && (
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></div>
            )}
          </button>

          {isNotifMenuOpen && (
            <div
              className={`absolute right-0 mt-2 w-80 rounded-xl border shadow-xl p-2 z-50 ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-white shadow-slate-950/60"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className={`flex items-center justify-between px-3 py-2 border-b ${
                isDark ? "border-slate-800" : "border-slate-100"
              }`}>
                <div className="font-semibold text-xs">Notifications</div>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-blue-500 hover:text-blue-400 font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className={`max-h-72 overflow-y-auto divide-y ${
                isDark ? "divide-slate-800" : "divide-slate-100"
              }`}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.link) navigateTo(n.link.view, n.link.subView, n.link.id);
                      setIsNotifMenuOpen(false);
                    }}
                    className={`p-2.5 cursor-pointer rounded-lg transition-colors ${
                      isDark
                        ? !n.read ? "bg-blue-950/40 hover:bg-slate-800/80" : "hover:bg-slate-800/50"
                        : !n.read ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-medium ${
                        !n.read
                          ? isDark ? "text-blue-400 font-semibold" : "text-blue-700 font-semibold"
                          : isDark ? "text-slate-200" : "text-slate-700"
                      }`}>
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className={`text-[11px] line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role & User Switcher */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border transition-all text-left cursor-pointer ${
              isDark
                ? "bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-200"
                : "bg-slate-100 hover:bg-slate-200/70 border-slate-200 text-slate-800"
            }`}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/30"
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className={`text-xs font-semibold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                {currentUser.role}
              </span>
            </div>
            <ChevronDown size={13} className={isDark ? "text-slate-400" : "text-slate-500"} />
          </button>

          {isUserMenuOpen && (
            <div
              className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-2 z-50 ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-white shadow-slate-950/80"
                  : "bg-white border-slate-200 text-slate-900 shadow-2xl"
              }`}
            >
              <div className={`px-3 py-2 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                <div className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-slate-400">{currentUser.email}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isDark ? "bg-blue-900/40 text-blue-300 border border-blue-800" : "bg-blue-50 text-blue-700 border border-blue-100"
                  }`}>
                    {currentUser.role}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {currentUser.department}
                  </span>
                </div>
              </div>

              {/* Quick Role Switcher */}
              <div className="p-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 pb-1.5">
                  Switch Persona / Role (RBAC)
                </div>
                <div className="space-y-1">
                  {availableUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        u.id === currentUser.id
                          ? isDark
                            ? "bg-blue-900/40 text-blue-300 font-semibold border border-blue-800"
                            : "bg-blue-50 text-blue-700 font-semibold border border-blue-100"
                          : isDark
                          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={u.avatar} className="w-5 h-5 rounded-full object-cover" />
                        <span>{u.name}</span>
                        <span className="text-[10px] text-slate-400">({u.role})</span>
                      </div>
                      {u.id === currentUser.id && <Check size={14} className="text-blue-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`border-t p-2 space-y-1 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Reset all CRM, Project, Task, and HR records back to default demo state?")) {
                      resetDemoData();
                      setIsUserMenuOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    isDark ? "text-amber-400 hover:bg-slate-800" : "text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                  }`}
                >
                  <RotateCcw size={14} /> Reset Demo Data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer font-medium"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
