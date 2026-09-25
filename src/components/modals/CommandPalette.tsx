import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckSquare,
  Users,
  Sparkles,
  Settings,
  Plus,
  ArrowRight,
  ShieldAlert,
  FileText,
  Clock,
  Briefcase,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    navigateTo,
    openCreateModal,
    setIsAiAssistantOpen,
    setIsAiAuditOpen,
    projects,
    tasks,
    companies,
    leads,
    employees,
  } = useApp();

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const quickNav = [
    { label: "Dashboard", view: "dashboard", icon: <LayoutDashboard size={15} /> },
    { label: "CRM - Sales Pipeline", view: "crm", subView: "pipeline", icon: <Building2 size={15} /> },
    { label: "CRM - Leads & Prospects", view: "crm", subView: "leads", icon: <Briefcase size={15} /> },
    { label: "Projects - All Projects", view: "projects", subView: "all", icon: <FolderKanban size={15} /> },
    { label: "Projects - Roadmap", view: "projects", subView: "roadmap", icon: <FolderKanban size={15} /> },
    { label: "Tasks - Kanban Board", view: "tasks", subView: "kanban", icon: <CheckSquare size={15} /> },
    { label: "Tasks - All Tasks", view: "tasks", subView: "all", icon: <Clock size={15} /> },
    { label: "HRM - Employees Directory", view: "hrm", subView: "employees", icon: <Users size={15} /> },
    { label: "HRM - Attendance Log", view: "hrm", subView: "attendance", icon: <Clock size={15} /> },
    { label: "HRM - Recruitment ATS", view: "hrm", subView: "recruitment", icon: <Users size={15} /> },
    { label: "AI Executive Insights", view: "ai", subView: "insights", icon: <Sparkles size={15} /> },
    { label: "System Settings", view: "settings", icon: <Settings size={15} /> },
  ];

  const filteredNav = quickNav.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const matchedProjects = projects.filter((p) =>
    (p.name || "").toLowerCase().includes(query.toLowerCase()) || (p.code || "").toLowerCase().includes(query.toLowerCase())
  );

  const matchedTasks = tasks.filter((t) =>
    (t.title || "").toLowerCase().includes(query.toLowerCase())
  );

  const matchedCompanies = companies.filter((c) =>
    (c.name || "").toLowerCase().includes(query.toLowerCase())
  );

  const matchedEmployees = employees.filter((e) =>
    (e.fullName || "").toLowerCase().includes(query.toLowerCase()) || (e.designation || "").toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectNav = (view: string, subView?: string) => {
    navigateTo(view, subView);
    setIsCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => setIsCommandPaletteOpen(false)}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-slate-950/90 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
          <Search size={18} className="text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, project, client, or employee name..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd
            onClick={() => setIsCommandPaletteOpen(false)}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 cursor-pointer"
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/40 text-xs">
          {/* Quick Actions */}
          {!query && (
            <div className="py-2">
              <div className="px-3 py-1 font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                Instant Actions
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCommandPaletteOpen(false);
                    openCreateModal("task");
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-200 text-left transition-colors"
                >
                  <Plus size={14} className="text-blue-400" />
                  <span>Create Task</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCommandPaletteOpen(false);
                    openCreateModal("lead");
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-200 text-left transition-colors"
                >
                  <Briefcase size={14} className="text-emerald-400" />
                  <span>Create Lead</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCommandPaletteOpen(false);
                    setIsAiAuditOpen(true);
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-200 text-left transition-colors"
                >
                  <ShieldAlert size={14} className="text-rose-400" />
                  <span>Operations Audit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCommandPaletteOpen(false);
                    setIsAiAssistantOpen(true);
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-200 text-left transition-colors"
                >
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Ask AI Intelligence</span>
                </button>
              </div>
            </div>
          )}

          {/* Nav Items */}
          {filteredNav.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                Navigation & Views
              </div>
              {filteredNav.slice(0, 5).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleSelectNav(item.view, item.subView)}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-400">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <ArrowRight size={13} className="text-slate-500" />
                </button>
              ))}
            </div>
          )}

          {/* Matched Projects */}
          {matchedProjects.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                Projects ({matchedProjects.length})
              </div>
              {matchedProjects.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectNav("projects", "all")}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-blue-400 font-semibold">{p.code}</span>
                    <span className="truncate">{p.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{p.status}</span>
                </button>
              ))}
            </div>
          )}

          {/* Matched Tasks */}
          {matchedTasks.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                Tasks ({matchedTasks.length})
              </div>
              {matchedTasks.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectNav("tasks", "kanban")}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <span className="truncate">{t.title}</span>
                  <span className="text-[10px] text-slate-400">{t.assigneeName}</span>
                </button>
              ))}
            </div>
          )}

          {/* Matched Employees */}
          {matchedEmployees.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                Employees ({matchedEmployees.length})
              </div>
              {matchedEmployees.slice(0, 3).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => handleSelectNav("hrm", "employees")}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <img src={e.avatar} className="w-5 h-5 rounded-full object-cover" />
                    <span>{e.fullName}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{e.designation}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
