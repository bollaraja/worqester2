import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { DataTable, Column } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { PriorityBadge } from "../components/common/PriorityBadge";
import { formatDate } from "../utils/formatters";
import {
  CheckSquare,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
  Calendar,
  Layers,
  User,
  Trash2,
  CheckCircle2,
  Circle,
  CalendarDays,
  Filter,
  Check,
  Pencil,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ArrowUpDown,
} from "lucide-react";
import { Task } from "../types";
import { EditTaskModal } from "../components/modals/EditModals";

export const TasksView: React.FC = () => {
  const {
    tasks,
    updateTask,
    addTaskComment,
    createTask,
    deleteItem,
    currentSubView,
    navigateTo,
    openCreateModal,
    projects,
    employees,
    toggleTaskCompletion,
    setTaskDueDate,
  } = useApp();

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(8); // September (0-indexed)

  const activeSubView = currentSubView || "kanban";
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState("");

  // Quick Task Creator Bar
  const [quickTitle, setQuickTitle] = useState("");
  const [quickProjectId, setQuickProjectId] = useState<string>(projects[0]?.id || "");
  const [quickDueDate, setQuickDueDate] = useState<string>(
    new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0]
  );
  const [quickPriority, setQuickPriority] = useState<"Low" | "Medium" | "High" | "Critical">("High");

  const taskColumns = ["Backlog", "To Do", "In Progress", "In Review", "Done"];

  const todayStr = "2026-09-19";
  const startOfWeek = "2026-09-14";
  const endOfWeek = "2026-09-20";
  const startOfMonth = "2026-09-01";
  const endOfMonth = "2026-09-30";

  const filteredTasks = tasks
    .filter((t) => {
      if (filterProject !== "all" && t.projectId !== filterProject) return false;
      if (filterPriority !== "all" && (t.priority || "").toLowerCase() !== filterPriority.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          (t.title || "").toLowerCase().includes(q) ||
          (t.projectName || "").toLowerCase().includes(q) ||
          (t.assigneeName || "").toLowerCase().includes(q) ||
          Boolean(t.notes && t.notes.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }
      if (filterDate === "today") {
        return t.dueDate === todayStr;
      }
      if (filterDate === "week") {
        return Boolean(t.dueDate && t.dueDate >= startOfWeek && t.dueDate <= endOfWeek);
      }
      if (filterDate === "month") {
        return Boolean(t.dueDate && t.dueDate >= startOfMonth && t.dueDate <= endOfMonth);
      }
      if (filterDate === "overdue") {
        return Boolean(t.slaBreached || (t.dueDate && t.dueDate < todayStr && t.status !== "Done"));
      }
      if (filterDate === "no-date") {
        return !t.dueDate;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "dueDateAsc") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === "dueDateDesc") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return b.dueDate.localeCompare(a.dueDate);
      }
      if (sortBy === "priority") {
        const pOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        return (pOrder[(b.priority || "").toLowerCase()] || 0) - (pOrder[(a.priority || "").toLowerCase()] || 0);
      }
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      return 0;
    });

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const proj = projects.find((p) => p.id === quickProjectId) || projects[0];
    createTask({
      title: quickTitle.trim(),
      description: `Task created for ${proj?.name || "Project"}`,
      projectId: proj ? proj.id : "proj-101",
      projectName: proj ? proj.name : "Cloud Portal Migration",
      assigneeId: "usr-01",
      assigneeName: "Alex Vance",
      reporterId: "usr-01",
      reporterName: "Alex Vance",
      priority: quickPriority,
      status: "To Do",
      labels: ["Sprint"],
      dueDate: quickDueDate,
      estimatedHours: 8,
      actualHours: 0,
    });

    setQuickTitle("");
  };

  const handleAdvanceTask = (task: Task, nextStatus: any) => {
    if (nextStatus === "Done") {
      toggleTaskCompletion(task.id);
    } else {
      updateTask(task.id, {
        status: nextStatus,
      });
    }
  };

  const completedCount = tasks.filter((t) => t.status === "Done").length;
  const pendingCount = tasks.filter((t) => t.status !== "Done").length;
  const overdueCount = tasks.filter((t) => t.slaBreached && t.status !== "Done").length;

  const tableColumns: Column<Task>[] = [
    {
      key: "title",
      header: "Task & Project",
      sortable: true,
      render: (t) => {
        const isDone = t.status === "Done";
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleTaskCompletion(t.id)}
              className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                isDone
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "border-slate-300 hover:border-blue-500 bg-white"
              }`}
              title={isDone ? "Mark incomplete" : "Mark as complete"}
            >
              {isDone && <Check size={12} strokeWidth={3} />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(t)}
                  className={`font-semibold text-xs text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors ${
                    isDone ? "line-through text-slate-400 font-normal" : "text-slate-900 dark:text-white"
                  }`}
                  title="Click to edit task details"
                >
                  {t.title}
                </button>
                {t.slaBreached && !isDone && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-600 font-mono font-bold border border-rose-200">
                    SLA Alert
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{t.projectName}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (t) => <StatusBadge status={t.status} size="sm" />,
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      render: (t) => <PriorityBadge priority={t.priority} size="sm" />,
    },
    {
      key: "assigneeName",
      header: "Assignee",
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-2">
          {t.assigneeAvatar ? (
            <img src={t.assigneeAvatar} className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
              {t.assigneeName.charAt(0)}
            </div>
          )}
          <span className="text-slate-700 text-xs">{t.assigneeName}</span>
        </div>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-400 shrink-0" />
          <input
            type="date"
            value={t.dueDate}
            onChange={(e) => setTaskDueDate(t.id, e.target.value)}
            className={`font-mono text-xs bg-transparent border-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 ${
              t.slaBreached && t.status !== "Done" ? "text-rose-600 font-bold" : "text-slate-700"
            }`}
            title="Click to change due date"
          />
        </div>
      ),
    },
    {
      key: "estimatedHours",
      header: "Hours (Act/Est)",
      render: (t) => (
        <span className="font-mono text-xs text-slate-600">
          {t.actualHours}h / {t.estimatedHours}h
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (t) => {
        const isDone = t.status === "Done";
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => toggleTaskCompletion(t.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                isDone
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
              }`}
            >
              {isDone ? "Reopen" : "Complete"}
            </button>
            <button
              type="button"
              onClick={() => setEditingTask(t)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
              title="Edit task"
            >
              <Pencil size={12} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => deleteItem("task", t.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete task"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Quick Status Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Total Tasks</span>
            <CheckSquare size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{tasks.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Across {projects.length} active enterprise projects
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Completed</span>
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}% completion rate
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Pending & In-Flight</span>
            <Clock size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Assigned across engineering & ops teams
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>SLA Attention</span>
            <AlertCircle size={16} className="text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{overdueCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Tasks requiring immediate triage</div>
        </div>
      </div>

      {/* Quick Add Task Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
        <form onSubmit={handleQuickCreate} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              required
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="What task needs to be done? (e.g. Implement user authentication test suite)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Project Selector */}
            <select
              value={quickProjectId}
              onChange={(e) => setQuickProjectId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 max-w-[200px]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>

            {/* Priority Selector */}
            <select
              value={quickPriority}
              onChange={(e) => setQuickPriority(e.target.value as any)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>

            {/* Due Date Picker */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <Calendar size={13} className="text-slate-400" />
              <input
                type="date"
                value={quickDueDate}
                onChange={(e) => setQuickDueDate(e.target.value)}
                className="text-xs font-mono text-slate-700 dark:text-slate-200 bg-transparent border-none focus:outline-none cursor-pointer"
                title="Set task due date"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0"
            >
              <Plus size={14} />
              <span>Add Task</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sub Navigation & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {[
            { id: "kanban", label: "Interactive Kanban", count: tasks.length },
            { id: "all", label: "All Tasks Table", count: tasks.length },
            { id: "calendar", label: "Deadlines Calendar", count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateTo("tasks", tab.id)}
              className={`px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubView === tab.id
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            title="Filter tasks by project"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            title="Filter tasks by priority"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Date Filter */}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            title="Filter tasks by due date"
          >
            <option value="all">📅 All Dates</option>
            <option value="today">📅 Due Today</option>
            <option value="week">📅 Due This Week</option>
            <option value="month">📅 Due This Month</option>
            <option value="overdue">⚠️ Overdue / SLA Alert</option>
            <option value="no-date">⚪ No Due Date</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            title="Sort task list order"
          >
            <option value="default">⇅ Sort: Default</option>
            <option value="dueDateAsc">⇅ Due Date (Earliest)</option>
            <option value="dueDateDesc">⇅ Due Date (Latest)</option>
            <option value="priority">⇅ Priority (High → Low)</option>
            <option value="title">⇅ Title (A → Z)</option>
          </select>

          <button
            type="button"
            onClick={() => openCreateModal("task")}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* VIEW: KANBAN BOARD */}
      {activeSubView === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {taskColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col);

            return (
              <div
                key={col}
                className="rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col min-h-[550px]"
              >
                {/* Column Header */}
                <div className="pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">{col}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreateModal("task")}
                    className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    title={`Add task to ${col}`}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Tasks List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-800/30">
                      No tasks in {col}
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const isDone = task.status === "Done";

                      return (
                        <div
                          key={task.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs hover:shadow-sm transition-all text-xs group space-y-2.5"
                        >
                          {/* Top Row: Checkbox + Title + Priority */}
                          <div className="flex items-start gap-2">
                            {/* 1-Click Task Complete Checkbox */}
                            <button
                              type="button"
                              onClick={() => toggleTaskCompletion(task.id)}
                              className={`w-4.5 h-4.5 rounded flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 border ${
                                isDone
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-white dark:bg-slate-900"
                              }`}
                              title={isDone ? "Mark as Incomplete" : "Mark as Complete"}
                            >
                              {isDone && <Check size={11} strokeWidth={3} />}
                            </button>

                            <div className="min-w-0 flex-1">
                              <span
                                onClick={() => setEditingTask(task)}
                                className={`font-semibold block line-clamp-2 cursor-pointer transition-colors ${
                                  isDone ? "line-through text-slate-400 dark:text-slate-500 font-normal" : "text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>

                            <PriorityBadge priority={task.priority} size="sm" />
                          </div>

                          {/* Project Tag */}
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate">{task.projectName}</span>
                          </div>

                          {/* Due Date (Interactive) & Assignee */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="text-slate-400 shrink-0" />
                              <input
                                type="date"
                                value={task.dueDate}
                                onChange={(e) => setTaskDueDate(task.id, e.target.value)}
                                className={`bg-transparent border-none text-[11px] font-mono cursor-pointer focus:outline-none ${
                                  task.slaBreached && !isDone
                                    ? "text-rose-600 font-bold"
                                    : "text-slate-600 dark:text-slate-300"
                                }`}
                                title="Click to update task due date"
                              />
                            </div>

                            {task.assigneeName && (
                              <div className="flex items-center gap-1.5 max-w-[100px] truncate" title={task.assigneeName}>
                                {task.assigneeAvatar ? (
                                  <img
                                    src={task.assigneeAvatar}
                                    className="w-4 h-4 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[9px] font-bold">
                                    {task.assigneeName.charAt(0)}
                                  </div>
                                )}
                                <span className="truncate text-[10px] text-slate-600 dark:text-slate-300">
                                  {task.assigneeName.split(" ")[0]}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Quick Workflow Move Controls */}
                          <div className="pt-1 flex items-center justify-between text-[10px]">
                            {/* Previous Status Button */}
                            {col !== "Backlog" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const idx = taskColumns.indexOf(col);
                                  if (idx > 0) handleAdvanceTask(task, taskColumns[idx - 1]);
                                }}
                                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold cursor-pointer"
                              >
                                ← Prev
                              </button>
                            ) : (
                              <span />
                            )}

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingTask(task)}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Edit task & comments"
                              >
                                <Pencil size={10} />
                                <span>Edit</span>
                              </button>
                              {((task.comments && task.comments.length > 0) || task.notes) && (
                                <button
                                  type="button"
                                  onClick={() => setEditingTask(task)}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                                  title={`${task.comments?.length || 0} comments • Click to open notes & comments`}
                                >
                                  <MessageSquare size={10} className="text-blue-500" />
                                  <span>{task.comments?.length || 0}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteItem("task", task.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            {/* Next Status Button */}
                            {col !== "Done" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const idx = taskColumns.indexOf(col);
                                  if (idx < taskColumns.length - 1)
                                    handleAdvanceTask(task, taskColumns[idx + 1]);
                                }}
                                className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold cursor-pointer flex items-center gap-0.5"
                              >
                                <span>Next</span>
                                <ArrowRight size={10} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAdvanceTask(task, "In Review")}
                                className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 hover:text-amber-700 font-semibold cursor-pointer"
                                title="Reopen task to In Review"
                              >
                                ↺ Reopen
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* VIEW: ALL TASKS TABLE */}
      {activeSubView === "all" && (
        <DataTable
          data={filteredTasks}
          columns={tableColumns}
          searchPlaceholder="Search task by title, project, assignee..."
          searchField={(t) => `${t.title} ${t.projectName} ${t.assigneeName}`}
        />
      )}

      {/* VIEW: DEADLINES CALENDAR (7-COLUMN MONTH GRID) */}
      {activeSubView === "calendar" && (() => {
        const monthNames = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
        const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sun
        
        const daysArray: (number | null)[] = [];
        for (let i = 0; i < firstDayOfWeek; i++) {
          daysArray.push(null);
        }
        for (let d = 1; d <= daysInMonth; d++) {
          daysArray.push(d);
        }

        const handlePrevMonth = () => {
          if (calendarMonth === 0) {
            setCalendarMonth(11);
            setCalendarYear((y) => y - 1);
          } else {
            setCalendarMonth((m) => m - 1);
          }
        };

        const handleNextMonth = () => {
          if (calendarMonth === 11) {
            setCalendarMonth(0);
            setCalendarYear((y) => y + 1);
          } else {
            setCalendarMonth((m) => m + 1);
          }
        };

        return (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Task Schedule & Deliverable Calendar</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Interactive monthly grid with SLA deadlines and assigned tasks</p>
              </div>

              {/* Month Switcher Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 w-36 text-center font-mono">
                  {monthNames[calendarMonth]} {calendarYear}
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalendarYear(2026);
                    setCalendarMonth(8);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer ml-1"
                >
                  Today
                </button>
              </div>
            </div>

            {/* 7-Column Month Grid */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-600 dark:text-slate-300 py-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 dark:divide-slate-800 bg-slate-100 dark:bg-slate-950">
                {daysArray.map((dayNum, idx) => {
                  if (dayNum === null) {
                    return <div key={`empty-${idx}`} className="bg-slate-50/50 dark:bg-slate-900/30 min-h-[90px]" />;
                  }

                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
                  const isToday = dateStr === "2026-09-17";

                  return (
                    <div
                      key={`day-${dayNum}`}
                      className={`bg-white dark:bg-slate-900 p-2 min-h-[95px] flex flex-col justify-between transition-colors hover:bg-blue-50/20 dark:hover:bg-blue-950/20 ${
                        isToday ? "ring-2 ring-blue-500 ring-inset" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                            isToday ? "bg-blue-600 text-white" : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {dayNum}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[70px]">
                        {dayTasks.map((t) => {
                          const isDone = t.status === "Done";
                          return (
                            <div
                              key={t.id}
                              onClick={() => setEditingTask(t)}
                              className={`px-1.5 py-1 rounded text-[10px] border font-medium cursor-pointer truncate transition-all ${
                                isDone
                                  ? "bg-slate-100 text-slate-400 border-slate-200 line-through"
                                  : t.priority === "Critical"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                  : t.priority === "High"
                                  ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                  : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                              }`}
                              title={`${t.title} (${t.projectName}) - Click to edit`}
                            >
                              {t.title}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Deadline List */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-900 mb-3">All Deadlines in Timeline</h4>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredTasks
                  .slice()
                  .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
                  .map((t) => {
                    const isDone = t.status === "Done";
                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          isDone
                            ? "bg-slate-50/70 border-slate-200 text-slate-400"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleTaskCompletion(t.id)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                              isDone
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 hover:border-blue-500 bg-white"
                            }`}
                          >
                            {isDone && <Check size={12} strokeWidth={3} />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold cursor-pointer hover:text-blue-600 ${
                                  isDone ? "line-through text-slate-400" : "text-slate-900"
                                }`}
                                onClick={() => setEditingTask(t)}
                              >
                                {t.title}
                              </span>
                              <PriorityBadge priority={t.priority} size="sm" />
                              <StatusBadge status={t.status} size="sm" />
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>{t.projectName}</span>
                              <span>•</span>
                              <span>Assignee: {t.assigneeName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingTask(t)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Edit task"
                          >
                            <Pencil size={12} />
                          </button>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700">
                            <Calendar size={11} className="text-slate-400" />
                            <span>{t.dueDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={true}
          onClose={() => setEditingTask(null)}
          projects={projects}
          employees={employees}
          onAddComment={(taskId, content) => addTaskComment(taskId, content)}
          onSave={(updated) => {
            updateTask(editingTask.id, updated);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};
