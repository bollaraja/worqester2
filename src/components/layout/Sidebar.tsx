import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderKanban,
  CheckSquare,
  FileText,
  BookOpen,
  BarChart3,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Plus,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Award,
  Wallet,
  Clock,
  UserCheck,
  Activity,
  Compass,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

interface NavGroupProps {
  title: string;
  icon: React.ReactNode;
  active: boolean;
  expanded: boolean;
  onToggle: () => void;
  collapsed: boolean;
  badge?: number | string;
  badgeColor?: string;
  children?: React.ReactNode;
}

const NavGroup: React.FC<NavGroupProps> = ({
  title,
  icon,
  active,
  expanded,
  onToggle,
  collapsed,
  badge,
  badgeColor = "bg-blue-500/20 text-blue-400",
  children,
}) => {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
          active
            ? "bg-slate-800 text-white font-semibold"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
        title={collapsed ? title : undefined}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              active ? "bg-blue-400" : "bg-slate-600"
            }`}
          />
          <span className={`${active ? "text-blue-400" : "text-slate-400"} flex-shrink-0`}>
            {icon}
          </span>
          {!collapsed && <span className="truncate tracking-tight text-sm">{title}</span>}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1.5 ml-2">
            {badge !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${badgeColor}`}>
                {badge}
              </span>
            )}
            {children && (
              <span className="text-slate-500 transition-transform duration-200">
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            )}
          </div>
        )}
      </button>
      {!collapsed && expanded && children && (
        <div className="mt-1 ml-4 pl-3 border-l border-slate-800 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
};

interface SubNavItemProps {
  title: string;
  active: boolean;
  onClick: () => void;
  badge?: number | string;
}

const SubNavItem: React.FC<SubNavItemProps> = ({ title, active, onClick, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
      active
        ? "bg-slate-800 text-white font-semibold"
        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
    }`}
  >
    <div className="flex items-center gap-2 truncate">
      <div className={`w-1 h-1 rounded-full ${active ? "bg-blue-400" : "bg-slate-600"}`} />
      <span className="truncate">{title}</span>
    </div>
    {badge !== undefined && (
      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
        {badge}
      </span>
    )}
  </button>
);

export const Sidebar: React.FC = () => {
  const {
    settings,
    currentView,
    currentSubView,
    navigateTo,
    sidebarCollapsed,
    setSidebarCollapsed,
    openCreateModal,
    kpis,
    leads,
    deals,
    projects,
    tasks,
  } = useApp();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    crm: true,
    projects: true,
    tasks: true,
    hrm: false,
    ai: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const { currentUser } = useApp();

  const enabledModules = {
    crm: true,
    projects: true,
    tasks: true,
    hrm: true,
    recruitment: true,
    attendance: true,
    expenses: true,
    assets: true,
    documents: true,
    reports: true,
    ai: true,
    automations: true,
    ...(settings?.modulesEnabled || {}),
    ...(settings?.enabledModules || {}),
  };

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 z-30 select-none ${
        sidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <div
          onClick={() => navigateTo("dashboard")}
          className="flex items-center gap-3 cursor-pointer overflow-hidden group"
        >
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            W
          </div>
          {!sidebarCollapsed && (
            <span className="text-white text-xl font-semibold tracking-tight truncate">
              Worqester
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Quick Action Button */}
      {!sidebarCollapsed ? (
        <div className="px-3 pt-3 pb-1">
          <button
            type="button"
            onClick={() => openCreateModal("task")}
            className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm shadow-blue-600/30 transition-all active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>New Action</span>
            <span className="ml-auto text-[10px] bg-blue-700/60 px-1.5 py-0.5 rounded font-mono">
              Ctrl+K
            </span>
          </button>
        </div>
      ) : (
        <div className="p-2 flex justify-center">
          <button
            type="button"
            onClick={() => openCreateModal("task")}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-600/30"
            title="Create Item (Ctrl+K)"
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-slate-800 space-y-1">
        {/* Dashboard */}
        <NavGroup
          title="Dashboard"
          icon={<LayoutDashboard size={18} />}
          active={currentView === "dashboard"}
          expanded={false}
          onToggle={() => navigateTo("dashboard")}
          collapsed={sidebarCollapsed}
        />

        {/* CRM */}
        {enabledModules.crm && (
          <NavGroup
            title="CRM"
            icon={<Building2 size={18} />}
            active={currentView === "crm"}
            expanded={expandedSections.crm}
            onToggle={() => {
              if (sidebarCollapsed) navigateTo("crm", "pipeline");
              else toggleSection("crm");
            }}
            collapsed={sidebarCollapsed}
            badge={kpis.activeLeads}
            badgeColor="bg-blue-500/20 text-blue-400"
          >
            <SubNavItem
              title="Sales Pipeline"
              active={currentView === "crm" && currentSubView === "pipeline"}
              onClick={() => navigateTo("crm", "pipeline")}
              badge={deals.length}
            />
            <SubNavItem
              title="Leads"
              active={currentView === "crm" && currentSubView === "leads"}
              onClick={() => navigateTo("crm", "leads")}
              badge={leads.length}
            />
            <SubNavItem
              title="Companies (Accounts)"
              active={currentView === "crm" && currentSubView === "companies"}
              onClick={() => navigateTo("crm", "companies")}
            />
            <SubNavItem
              title="Contacts"
              active={currentView === "crm" && currentSubView === "contacts"}
              onClick={() => navigateTo("crm", "contacts")}
            />
            <SubNavItem
              title="Deals"
              active={currentView === "crm" && currentSubView === "deals"}
              onClick={() => navigateTo("crm", "deals")}
            />
            <SubNavItem
              title="Customer 360"
              active={currentView === "crm" && currentSubView === "customer360"}
              onClick={() => navigateTo("crm", "customer360", "comp-01")}
            />
            <SubNavItem
              title="Activities"
              active={currentView === "crm" && currentSubView === "activities"}
              onClick={() => navigateTo("crm", "activities")}
            />
          </NavGroup>
        )}

        {/* Projects */}
        {enabledModules.projects && (
          <NavGroup
            title="Projects"
            icon={<FolderKanban size={18} />}
            active={currentView === "projects"}
            expanded={expandedSections.projects}
            onToggle={() => {
              if (sidebarCollapsed) navigateTo("projects", "all");
              else toggleSection("projects");
            }}
            collapsed={sidebarCollapsed}
            badge={projects.length}
          >
            <SubNavItem
              title="All Projects"
              active={currentView === "projects" && currentSubView === "all"}
              onClick={() => navigateTo("projects", "all")}
              badge={projects.length}
            />
            <SubNavItem
              title="Roadmap & Timeline"
              active={currentView === "projects" && currentSubView === "roadmap"}
              onClick={() => navigateTo("projects", "roadmap")}
            />
            <SubNavItem
              title="Milestones"
              active={currentView === "projects" && currentSubView === "milestones"}
              onClick={() => navigateTo("projects", "milestones")}
            />
          </NavGroup>
        )}

        {/* Tasks */}
        {enabledModules.tasks && (
          <NavGroup
            title="Tasks"
            icon={<CheckSquare size={18} />}
            active={currentView === "tasks"}
            expanded={expandedSections.tasks}
            onToggle={() => {
              if (sidebarCollapsed) navigateTo("tasks", "kanban");
              else toggleSection("tasks");
            }}
            collapsed={sidebarCollapsed}
            badge={kpis.overdueTasks > 0 ? `${kpis.overdueTasks} Overdue` : tasks.length}
            badgeColor={kpis.overdueTasks > 0 ? "bg-rose-500/20 text-rose-400" : "bg-slate-700 text-slate-300"}
          >
            <SubNavItem
              title="Kanban Board"
              active={currentView === "tasks" && currentSubView === "kanban"}
              onClick={() => navigateTo("tasks", "kanban")}
            />
            <SubNavItem
              title="All Tasks Table"
              active={currentView === "tasks" && currentSubView === "all"}
              onClick={() => navigateTo("tasks", "all")}
              badge={tasks.length}
            />
            <SubNavItem
              title="Calendar Schedule"
              active={currentView === "tasks" && currentSubView === "calendar"}
              onClick={() => navigateTo("tasks", "calendar")}
            />
          </NavGroup>
        )}

        {/* HRM */}
        {enabledModules.hrm && (
          <NavGroup
            title="HRM"
            icon={<Users size={18} />}
            active={currentView === "hrm"}
            expanded={expandedSections.hrm}
            onToggle={() => {
              const defaultSub = currentUser.role === "Employee" ? "self-service" : "dashboard";
              if (sidebarCollapsed) navigateTo("hrm", defaultSub);
              else toggleSection("hrm");
            }}
            collapsed={sidebarCollapsed}
            badge={kpis.totalEmployees}
          >
            {currentUser.role === "Employee" ? (
              <>
                <SubNavItem
                  title="My Self Service Portal"
                  active={currentView === "hrm" && currentSubView === "self-service"}
                  onClick={() => navigateTo("hrm", "self-service")}
                />
                <SubNavItem
                  title="My Attendance"
                  active={currentView === "hrm" && currentSubView === "attendance"}
                  onClick={() => navigateTo("hrm", "attendance")}
                  badge={`${kpis.attendanceToday} In`}
                />
                <SubNavItem
                  title="My Leaves"
                  active={currentView === "hrm" && currentSubView === "leave"}
                  onClick={() => navigateTo("hrm", "leave")}
                />
                <SubNavItem
                  title="My Expenses & Claims"
                  active={currentView === "hrm" && currentSubView === "expenses"}
                  onClick={() => navigateTo("hrm", "expenses")}
                />
                <SubNavItem
                  title="Company Directory"
                  active={currentView === "hrm" && currentSubView === "employees"}
                  onClick={() => navigateTo("hrm", "employees")}
                />
                <SubNavItem
                  title="Departments & Org Chart"
                  active={currentView === "hrm" && currentSubView === "departments"}
                  onClick={() => navigateTo("hrm", "departments")}
                />
                <SubNavItem
                  title="My Allocated Assets"
                  active={currentView === "hrm" && currentSubView === "assets"}
                  onClick={() => navigateTo("hrm", "assets")}
                />
              </>
            ) : (
              <>
                <SubNavItem
                  title="HR Dashboard"
                  active={currentView === "hrm" && currentSubView === "dashboard"}
                  onClick={() => navigateTo("hrm", "dashboard")}
                />
                <SubNavItem
                  title="Employees Directory"
                  active={currentView === "hrm" && currentSubView === "employees"}
                  onClick={() => navigateTo("hrm", "employees")}
                />
                <SubNavItem
                  title="Departments & Org Chart"
                  active={currentView === "hrm" && currentSubView === "departments"}
                  onClick={() => navigateTo("hrm", "departments")}
                />
                <SubNavItem
                  title="Attendance"
                  active={currentView === "hrm" && currentSubView === "attendance"}
                  onClick={() => navigateTo("hrm", "attendance")}
                  badge={`${kpis.attendanceToday} In`}
                />
                <SubNavItem
                  title="Leave Management"
                  active={currentView === "hrm" && currentSubView === "leave"}
                  onClick={() => navigateTo("hrm", "leave")}
                  badge={kpis.pendingLeaves > 0 ? kpis.pendingLeaves : undefined}
                />
                <SubNavItem
                  title="Recruitment / ATS"
                  active={currentView === "hrm" && currentSubView === "recruitment"}
                  onClick={() => navigateTo("hrm", "recruitment")}
                  badge={kpis.openPositionsCount}
                />
                <SubNavItem
                  title="Employee Self Service"
                  active={currentView === "hrm" && currentSubView === "self-service"}
                  onClick={() => navigateTo("hrm", "self-service")}
                />
                <SubNavItem
                  title="Expenses"
                  active={currentView === "hrm" && currentSubView === "expenses"}
                  onClick={() => navigateTo("hrm", "expenses")}
                />
                <SubNavItem
                  title="Assets"
                  active={currentView === "hrm" && currentSubView === "assets"}
                  onClick={() => navigateTo("hrm", "assets")}
                />
              </>
            )}
          </NavGroup>
        )}

        {/* Team Workload */}
        <NavGroup
          title="Team Workload"
          icon={<UserCheck size={18} />}
          active={currentView === "team"}
          expanded={false}
          onToggle={() => navigateTo("team")}
          collapsed={sidebarCollapsed}
        />

        {/* Documents */}
        {enabledModules.documents && (
          <NavGroup
            title="Documents"
            icon={<FileText size={18} />}
            active={currentView === "documents"}
            expanded={false}
            onToggle={() => navigateTo("documents")}
            collapsed={sidebarCollapsed}
          />
        )}

        {/* Notes */}
        <NavGroup
          title="Notes"
          icon={<BookOpen size={18} />}
          active={currentView === "notes"}
          expanded={false}
          onToggle={() => navigateTo("notes")}
          collapsed={sidebarCollapsed}
        />

        {/* Reports */}
        {enabledModules.reports && (
          <NavGroup
            title="Reports & Analytics"
            icon={<BarChart3 size={18} />}
            active={currentView === "reports"}
            expanded={false}
            onToggle={() => navigateTo("reports")}
            collapsed={sidebarCollapsed}
          />
        )}

        {/* AI & Automation */}
        {enabledModules.ai && (
          <NavGroup
            title="AI & Automation"
            icon={<Sparkles size={18} className="text-amber-400" />}
            active={currentView === "ai"}
            expanded={expandedSections.ai}
            onToggle={() => {
              if (sidebarCollapsed) navigateTo("ai", "insights");
              else toggleSection("ai");
            }}
            collapsed={sidebarCollapsed}
            badge="AI"
            badgeColor="bg-amber-500/20 text-amber-400"
          >
            <SubNavItem
              title="AI Executive Insights"
              active={currentView === "ai" && currentSubView === "insights"}
              onClick={() => navigateTo("ai", "insights")}
            />
            <SubNavItem
              title="Smart Priority"
              active={currentView === "ai" && currentSubView === "smart-priority"}
              onClick={() => navigateTo("ai", "smart-priority")}
            />
            <SubNavItem
              title="AI Operations Audit"
              active={currentView === "ai" && currentSubView === "audit"}
              onClick={() => navigateTo("ai", "audit")}
            />
            <SubNavItem
              title="Automations Engine"
              active={currentView === "ai" && currentSubView === "automations"}
              onClick={() => navigateTo("ai", "automations")}
            />
          </NavGroup>
        )}

        {/* Settings */}
        <NavGroup
          title="Settings"
          icon={<Settings size={18} />}
          active={currentView === "settings"}
          expanded={false}
          onToggle={() => navigateTo("settings")}
          collapsed={sidebarCollapsed}
        />
      </div>

      {/* User Profile Footer */}
      <div className="p-4 mt-auto border-t border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
            {currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest truncate">
                {currentUser.role}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
