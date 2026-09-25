import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { DataTable, Column } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { PriorityBadge } from "../components/common/PriorityBadge";
import { formatCurrency, formatDate } from "../utils/formatters";
import {
  FolderKanban,
  Plus,
  Calendar,
  Layers,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  CheckSquare,
  Square,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Sparkles,
  Pencil,
  Check,
} from "lucide-react";
import { Project, Task, Milestone } from "../types";
import { EditProjectModal, AddMilestoneModal, EditMilestoneModal } from "../components/modals/EditModals";

export const ProjectsView: React.FC = () => {
  const {
    projects,
    updateProject,
    deleteItem,
    currentSubView,
    navigateTo,
    openCreateModal,
    settings,
    tasks,
    toggleTaskCompletion,
    setTaskDueDate,
    milestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  } = useApp();

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);

  const activeSubView = currentSubView || "cards";
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Quick Inline Task Creator State for a selected project
  const [quickTaskProjectId, setQuickTaskProjectId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskDueDate, setQuickTaskDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );

  const { createTask } = useApp();

  const handleQuickAddTask = (projectId: string, projectName: string) => {
    if (!quickTaskTitle.trim()) return;
    createTask({
      title: quickTaskTitle.trim(),
      description: `Task created for ${projectName}`,
      projectId,
      projectName,
      assigneeId: "usr-01",
      assigneeName: "Alex Vance",
      reporterId: "usr-01",
      reporterName: "Alex Vance",
      priority: "High",
      status: "To Do",
      labels: ["Project-Milestone"],
      dueDate: quickTaskDueDate,
      estimatedHours: 8,
      actualHours: 0,
    });
    setQuickTaskTitle("");
    setQuickTaskProjectId(null);
  };

  const filteredProjects = projects.filter((p) => {
    if (filterStatus !== "all" && (p.status || "").toLowerCase() !== filterStatus.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.code || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate high-level summary KPIs
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter((p) => p.status === "In Progress").length;
  const completedProjects = projects.filter((p) => p.status === "Completed").length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Done").length;
  const overallTaskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const projectColumns: Column<Project>[] = [
    {
      key: "name",
      header: "Project & Code",
      sortable: true,
      render: (p) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {p.code}
            </span>
            <button
              type="button"
              onClick={() => setEditingProject(p)}
              className="font-semibold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left transition-colors"
              title="Click to edit project details"
            >
              {p.name}
            </button>
          </div>
          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{p.description}</div>
        </div>
      ),
    },
    {
      key: "health",
      header: "Health",
      sortable: true,
      render: (p) => <StatusBadge status={p.health} size="sm" />,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (p) => <StatusBadge status={p.status} size="sm" />,
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      render: (p) => <PriorityBadge priority={p.priority} size="sm" />,
    },
    {
      key: "progress",
      header: "Progress",
      sortable: true,
      render: (p) => {
        const projTasks = tasks.filter((t) => t.projectId === p.id);
        const done = projTasks.filter((t) => t.status === "Done").length;
        return (
          <div className="w-32 space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-600">
              <span>{p.progress}%</span>
              <span>{done}/{projTasks.length} tasks</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  p.progress === 100
                    ? "bg-emerald-500"
                    : p.health === "Critical"
                    ? "bg-rose-500"
                    : p.health === "At Risk"
                    ? "bg-amber-500"
                    : "bg-blue-600"
                }`}
                style={{ width: `${p.progress}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "budget",
      header: "Budget & Spent",
      sortable: true,
      render: (p) => (
        <div className="text-xs">
          <div className="font-mono font-semibold text-slate-900">
            {formatCurrency(p.budget, settings?.currency || "INR", settings?.currencySymbol || "₹")}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Spent: {formatCurrency(p.spent, settings?.currency || "INR", settings?.currencySymbol || "₹")} (
            {Math.round((p.spent / p.budget) * 100)}%)
          </div>
        </div>
      ),
    },
    {
      key: "projectManagerName",
      header: "Manager",
      render: (p) => <span className="text-slate-700 text-xs font-medium">{p.projectManagerName}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openCreateModal("task", { projectId: p.id })}
            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-medium transition-colors cursor-pointer"
          >
            + Add Task
          </button>
          <button
            type="button"
            onClick={() => setEditingProject(p)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
            title="Edit Project"
          >
            <Pencil size={12} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => deleteItem("project", p.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Project"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Total Projects</span>
            <FolderKanban size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalProjects}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
            <span className="text-blue-600 font-semibold">{inProgressProjects} In Progress</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">{completedProjects} Completed</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Task Completion</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overallTaskProgress}%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="font-semibold text-slate-700">{completedTasks}</span> of {totalTasks} total tasks finished
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>On-Track Health</span>
            <TrendingUp size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {projects.filter((p) => p.health === "Healthy").length} / {totalProjects}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="text-rose-600 font-semibold">
              {projects.filter((p) => p.health === "Critical" || p.health === "At Risk").length} projects needing attention
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Deliverables Due</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {tasks.filter((t) => t.status !== "Done").length}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
            <Calendar size={12} /> Active sprint milestones
          </div>
        </div>
      </div>

      {/* Sub Navigation & Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          {[
            { id: "cards", label: "Projects & Tasks Breakdown", count: projects.length },
            { id: "all", label: "Table Overview", count: null },
            { id: "roadmap", label: "Roadmap & Gantt", count: null },
            { id: "milestones", label: "Deliverable Milestones", count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateTo("projects", tab.id)}
              className={`px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubView === tab.id
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => openCreateModal("project")}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* VIEW: CARDS & TASK BREAKDOWN (Primary View requested by user) */}
      {activeSubView === "cards" && (
        <div className="space-y-4">
          {/* Quick Filters */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter projects by title, code..."
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 w-64"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Project Statuses</option>
                <option value="in progress">In Progress</option>
                <option value="planning">Planning</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{filteredProjects.length}</span> projects
            </div>
          </div>

          {/* Projects Cards Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredProjects.map((project) => {
              const projectTasks = tasks.filter((t) => t.projectId === project.id);
              const completedTasksCount = projectTasks.filter((t) => t.status === "Done").length;
              const isAddingTask = quickTaskProjectId === project.id;

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5"
                >
                  {/* Card Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {project.code}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{project.name}</h3>
                        <StatusBadge status={project.status} size="sm" />
                        <PriorityBadge priority={project.priority} size="sm" />
                        <StatusBadge status={project.health} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 max-w-3xl">
                        {project.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openCreateModal("task", { projectId: project.id })}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add Task</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProject(project)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit project"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItem("project", project.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Project Meta Bar: Dates, Budget, Manager, Progress */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-b border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Timeline</span>
                      <span className="font-mono font-medium text-slate-700">
                        {project.startDate} → {project.endDate}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Project Manager</span>
                      <span className="font-medium text-slate-800">{project.projectManagerName}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Budget Allocation</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatCurrency(project.budget, settings?.currency || "INR", settings?.currencySymbol || "₹")}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500 font-medium">Completion Progress</span>
                        <span className="font-mono font-bold text-slate-800">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            project.progress === 100
                              ? "bg-emerald-500"
                              : project.health === "Critical"
                              ? "bg-rose-500"
                              : "bg-blue-600"
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nested Tasks Section */}
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          Project Tasks ({projectTasks.length})
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          ({completedTasksCount} of {projectTasks.length} done)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuickTaskProjectId(isAddingTask ? null : project.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>{isAddingTask ? "Cancel Quick Add" : "Quick Add Task Here"}</span>
                      </button>
                    </div>

                    {/* Inline Quick Add Task Input */}
                    {isAddingTask && (
                      <div className="mb-3 p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <input
                          type="text"
                          value={quickTaskTitle}
                          onChange={(e) => setQuickTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleQuickAddTask(project.id, project.name);
                            }
                          }}
                          placeholder="Type task title and press Enter (e.g. Implement schema migration)..."
                          className="flex-1 px-3 py-2 rounded-lg bg-white border border-blue-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-medium text-slate-600 shrink-0">Due:</label>
                          <input
                            type="date"
                            value={quickTaskDueDate}
                            onChange={(e) => setQuickTaskDueDate(e.target.value)}
                            className="px-2 py-1.5 rounded-lg bg-white border border-blue-200 text-xs text-slate-700 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuickAddTask(project.id, project.name)}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tasks List */}
                    {projectTasks.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-xs text-slate-500">No tasks added to this project yet.</p>
                        <button
                          type="button"
                          onClick={() => setQuickTaskProjectId(project.id)}
                          className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={13} /> Add first task
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {projectTasks.map((task) => {
                          const isDone = task.status === "Done";
                          return (
                            <div
                              key={task.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
                                isDone
                                  ? "bg-slate-50/80 border-slate-200 text-slate-400"
                                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {/* 1-Click Complete Toggle Checkbox */}
                                <button
                                  type="button"
                                  onClick={() => toggleTaskCompletion(task.id)}
                                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                                    isDone
                                      ? "bg-emerald-600 border-emerald-600 text-white"
                                      : "border-slate-300 hover:border-blue-500 bg-white"
                                  }`}
                                  title={isDone ? "Mark incomplete" : "Mark as complete"}
                                >
                                  {isDone && <CheckCircle2 size={13} className="text-white" />}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <span
                                    className={`font-semibold block truncate ${
                                      isDone ? "line-through text-slate-400 font-normal" : "text-slate-800"
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0 ml-3">
                                <PriorityBadge priority={task.priority} size="sm" />
                                <StatusBadge status={task.status} size="sm" />

                                {/* Interactive Due Date Editor */}
                                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                                  <Calendar size={12} className="text-slate-400" />
                                  <input
                                    type="date"
                                    value={task.dueDate}
                                    onChange={(e) => setTaskDueDate(task.id, e.target.value)}
                                    className="bg-transparent border-none text-[11px] font-mono text-slate-700 cursor-pointer focus:outline-none"
                                    title="Click to change task due date"
                                  />
                                </div>

                                <div className="text-[11px] text-slate-600 hidden md:block">
                                  {task.assigneeName}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => deleteItem("task", task.id)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete task"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: ALL PROJECTS TABLE */}
      {activeSubView === "all" && (
        <DataTable
          data={filteredProjects}
          columns={projectColumns}
          searchPlaceholder="Search project by name, code, description..."
          searchField={(p) => `${p.name} ${p.code} ${p.description}`}
          filterComponent={
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="in progress">In Progress</option>
              <option value="planning">Planning</option>
              <option value="completed">Completed</option>
            </select>
          }
        />
      )}

      {/* VIEW: ROADMAP & TIMELINE */}
      {activeSubView === "roadmap" && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Enterprise Strategic Timeline (2026 - 2027)
              </h3>
              <p className="text-xs text-slate-500">Quarterly release roadmap and delivery schedules</p>
            </div>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Q3 2026 Current
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-slate-500 border-b border-slate-100 pb-2">
              <div className="bg-slate-50 py-1.5 rounded-lg border border-slate-200">Q2 2026 (Apr - Jun)</div>
              <div className="bg-blue-50 text-blue-700 py-1.5 rounded-lg border border-blue-200">
                Q3 2026 (Jul - Sep) Active
              </div>
              <div className="bg-slate-50 py-1.5 rounded-lg border border-slate-200">Q4 2026 (Oct - Dec)</div>
              <div className="bg-slate-50 py-1.5 rounded-lg border border-slate-200">Q1 2027 (Jan - Mar)</div>
            </div>

            {projects.map((proj, idx) => (
              <div key={proj.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-blue-700 font-bold bg-blue-100 px-1.5 py-0.5 rounded">
                      {proj.code}
                    </span>
                    <span className="font-semibold text-slate-900">{proj.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                    <span>
                      {proj.startDate} → {proj.endDate}
                    </span>
                    <StatusBadge status={proj.health} size="sm" />
                  </div>
                </div>

                <div className="w-full bg-slate-200 h-6 rounded-lg relative overflow-hidden flex items-center px-3">
                  <div
                    className={`absolute top-0 bottom-0 left-0 rounded-lg ${
                      proj.health === "Critical"
                        ? "bg-rose-500"
                        : proj.health === "At Risk"
                        ? "bg-amber-500"
                        : "bg-blue-600"
                    }`}
                    style={{
                      left: `${idx === 0 ? 0 : idx === 1 ? 20 : idx === 2 ? 10 : 35}%`,
                      width: `${Math.max(30, proj.progress)}%`,
                    }}
                  >
                    <span className="absolute inset-0 flex items-center px-3 text-[10px] font-mono font-bold text-white truncate">
                      {proj.name} ({proj.progress}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: MILESTONES */}
      {activeSubView === "milestones" && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Deliverable Milestones</h3>
              <p className="text-xs text-slate-500">Formal contractual deliverables and verification gates</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddMilestoneOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Milestone</span>
            </button>
          </div>

          <div className="space-y-3">
            {milestones.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No milestones recorded yet. Click &quot;Add Milestone&quot; to establish strategic gates.
              </div>
            ) : (
              milestones.map((m) => {
                const isCompleted = m.status === "Completed";
                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isCompleted ? "bg-slate-50/70 border-slate-200" : "bg-white border-slate-200 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* 1-Click Status Toggle Checkbox */}
                      <button
                        type="button"
                        onClick={() =>
                          updateMilestone(m.id, {
                            status: isCompleted ? "In Progress" : "Completed",
                          })
                        }
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                          isCompleted
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 hover:border-blue-500 bg-white"
                        }`}
                        title={isCompleted ? "Mark In Progress" : "Mark Completed"}
                      >
                        {isCompleted && <Check size={12} strokeWidth={3} />}
                      </button>

                      <div className="space-y-0.5">
                        <div className={`font-bold ${isCompleted ? "line-through text-slate-400" : "text-slate-900"}`}>
                          {m.name}
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{m.projectName}</span>
                          {m.weight && (
                            <>
                              <span>•</span>
                              <span className="text-amber-700 font-mono font-semibold">{m.weight}</span>
                            </>
                          )}
                          {m.description && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500">{m.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 text-xs">{m.dueDate}</span>
                      <StatusBadge status={m.status} size="sm" />
                      <button
                        type="button"
                        onClick={() => setEditingMilestone(m)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit milestone"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMilestone(m.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete milestone"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          isOpen={true}
          onClose={() => setEditingProject(null)}
          onSave={(updated) => {
            updateProject(editingProject.id, updated);
            setEditingProject(null);
          }}
        />
      )}

      {/* Edit Milestone Modal */}
      {editingMilestone && (
        <EditMilestoneModal
          milestone={editingMilestone}
          isOpen={true}
          onClose={() => setEditingMilestone(null)}
          onSave={(updated) => {
            updateMilestone(editingMilestone.id, updated);
            setEditingMilestone(null);
          }}
        />
      )}

      {/* Add Milestone Modal */}
      {isAddMilestoneOpen && (
        <AddMilestoneModal
          projects={projects}
          isOpen={true}
          onClose={() => setIsAddMilestoneOpen(false)}
          onSave={(data) => {
            createMilestone(data);
            setIsAddMilestoneOpen(false);
          }}
        />
      )}
    </div>
  );
};
