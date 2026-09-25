import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  RefreshCw,
  Sparkles,
} from "lucide-react";

type RangePreset = "today" | "7d" | "30d" | "quarter" | "ytd" | "all" | "custom";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#f43f5e", "#06b6d4"];

export const ReportsView: React.FC = () => {
  const { deals, projects, tasks, employees, departments, settings } = useApp();

  // Range and filter state
  const [rangePreset, setRangePreset] = useState<RangePreset>("30d");
  const [startDate, setStartDate] = useState("2026-08-20");
  const [endDate, setEndDate] = useState("2026-09-19");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [reportGeneratedTime, setReportGeneratedTime] = useState<string>("Just now");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle Preset Changes
  const handlePresetChange = (preset: RangePreset) => {
    setRangePreset(preset);
    const today = "2026-09-19";
    if (preset === "today") {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === "7d") {
      setStartDate("2026-09-12");
      setEndDate(today);
    } else if (preset === "30d") {
      setStartDate("2026-08-20");
      setEndDate(today);
    } else if (preset === "quarter") {
      setStartDate("2026-07-01");
      setEndDate(today);
    } else if (preset === "ytd") {
      setStartDate("2026-01-01");
      setEndDate(today);
    } else if (preset === "all") {
      setStartDate("2025-01-01");
      setEndDate("2026-12-31");
    }
  };

  // Generate Report Action
  const handleGenerateReport = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setReportGeneratedTime(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }, 400);
  };

  // Dynamically Filter Deals based on Expected Close Date and Project
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      const closeDate = d.expectedCloseDate || "";
      if (startDate && closeDate && closeDate < startDate) return false;
      if (endDate && closeDate && closeDate > endDate) return false;
      return true;
    });
  }, [deals, startDate, endDate]);

  // Dynamically Filter Tasks based on Due Date and Project
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedProject !== "all" && t.projectId !== selectedProject) return false;
      const dDate = t.dueDate || "";
      if (startDate && dDate && dDate < startDate) return false;
      if (endDate && dDate && dDate > endDate) return false;
      return true;
    });
  }, [tasks, selectedProject, startDate, endDate]);

  // Dynamically Filter Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedProject !== "all" && p.id !== selectedProject) return false;
      return true;
    });
  }, [projects, selectedProject]);

  // Dynamically Filter Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (selectedDept !== "all" && e.department !== selectedDept) return false;
      return true;
    });
  }, [employees, selectedDept]);

  // Metrics Calculation
  const realizedRevenue = useMemo(() => {
    return filteredDeals
      .filter((d) => d.stage === "Closed Won")
      .reduce((sum, d) => sum + d.amount, 0);
  }, [filteredDeals]);

  const openPipelineValue = useMemo(() => {
    return filteredDeals
      .filter((d) => d.stage !== "Closed Won")
      .reduce((sum, d) => sum + d.amount, 0);
  }, [filteredDeals]);

  const targetRevenue = 15000000; // Benchmark target ₹1.5 Cr
  const targetPct = Math.round((realizedRevenue / (targetRevenue || 1)) * 100);

  const completedTasksCount = filteredTasks.filter((t) => t.status === "Done").length;
  const taskCompletionRate = filteredTasks.length > 0 ? Math.round((completedTasksCount / filteredTasks.length) * 100) : 100;
  const slaBreaches = filteredTasks.filter((t) => t.slaBreached && t.status !== "Done").length;

  const totalCapitalBudget = filteredProjects.reduce((sum, p) => sum + p.budget, 0);
  const totalCapitalSpent = filteredProjects.reduce((sum, p) => sum + p.spent, 0);
  const budgetUtilization = totalCapitalBudget > 0 ? Math.round((totalCapitalSpent / totalCapitalBudget) * 100) : 0;

  // Deals by stage for Pie Chart
  const stageData = useMemo(() => {
    const counts: Record<string, number> = {
      New: 0,
      Qualification: 0,
      Discovery: 0,
      Proposal: 0,
      Negotiation: 0,
      "Closed Won": 0,
    };
    filteredDeals.forEach((d) => {
      counts[d.stage] = (counts[d.stage] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [filteredDeals]);

  // Department cost and headcount data
  const deptData = useMemo(() => {
    const list = selectedDept === "all" ? departments : departments.filter((d) => d.name === selectedDept);
    return list.map((d) => ({
      name: d.name.split(" ")[0],
      budget: d.budget / 100000,
      headcount: employees.filter((e) => e.department === d.name).length,
    }));
  }, [departments, employees, selectedDept]);

  // Project budget vs spent chart
  const projectComparisonData = useMemo(() => {
    return filteredProjects.map((p) => ({
      code: p.code,
      name: p.name,
      budget: p.budget / 100000,
      spent: p.spent / 100000,
    }));
  }, [filteredProjects]);

  // Monthly revenue trend
  const monthlyRevData = [
    { month: "Jan", revenue: 3200000, target: 3000000 },
    { month: "Feb", revenue: 4100000, target: 3500000 },
    { month: "Mar", revenue: 4800000, target: 4000000 },
    { month: "Apr", revenue: 4200000, target: 4500000 },
    { month: "May", revenue: 5800000, target: 5000000 },
    { month: "Jun", revenue: 7100000, target: 6000000 },
    { month: "Jul", revenue: 6400000, target: 6500000 },
    { month: "Aug", revenue: 8900000, target: 7000000 },
    { month: "Sep", revenue: 11400000, target: 8000000 },
  ];

  // Export Real CSV with Filtered Report Data
  const exportReport = () => {
    const rows = [
      ["Worqester Executive Business Performance Report"],
      [`Generated At: ${new Date().toISOString()}`],
      [`Time Period: ${startDate} to ${endDate} (${rangePreset.toUpperCase()})`],
      [`Department: ${selectedDept}`],
      [`Project Filter: ${selectedProject}`],
      [],
      ["EXECUTIVE SUMMARY METRICS"],
      ["Realized Revenue (INR)", realizedRevenue],
      ["Revenue Target (INR)", targetRevenue],
      ["Target Achievement Rate (%)", `${targetPct}%`],
      ["Open Pipeline Value (INR)", openPipelineValue],
      ["Deliverable Tasks Total", filteredTasks.length],
      ["Tasks Completed", completedTasksCount],
      ["Task Completion Rate", `${taskCompletionRate}%`],
      ["SLA Breaches", slaBreaches],
      ["Total Project Budget (INR)", totalCapitalBudget],
      ["Total Capital Spent (INR)", totalCapitalSpent],
      ["Budget Utilization Rate", `${budgetUtilization}%`],
      [],
      ["DEALS IN PERIOD", "Stage", "Amount (INR)", "Probability (%)", "Expected Close Date", "Priority"],
      ...filteredDeals.map((d) => [d.name, d.stage, d.amount, d.probability, d.expectedCloseDate, d.priority]),
      [],
      ["PROJECTS SUMMARY", "Code", "Status", "Budget (INR)", "Spent (INR)", "Progress (%)", "Health"],
      ...filteredProjects.map((p) => [p.name, p.code, p.status, p.budget, p.spent, `${p.progress}%`, p.health]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `worqester_manual_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-mono font-bold uppercase tracking-wider">
              Executive Telemetry & BI
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Updated: {reportGeneratedTime}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Reports & Executive Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Real-time financial performance, departmental budget burn, sales pipeline qualification gates, and workforce utilization.
          </p>
        </div>

        {/* Global Export & Print Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Print Executive Brief"
          >
            <Printer size={14} />
            <span>Print Brief</span>
          </button>

          <button
            type="button"
            onClick={exportReport}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            title="Export full report as CSV"
          >
            <Download size={14} />
            <span>Export Summary (CSV)</span>
          </button>
        </div>
      </div>

      {/* Interactive Time/Range Filter Control Panel */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto text-xs">
            {[
              { id: "today", label: "Today" },
              { id: "7d", label: "Last 7 Days" },
              { id: "30d", label: "Last 30 Days" },
              { id: "quarter", label: "This Quarter" },
              { id: "ytd", label: "YTD" },
              { id: "all", label: "All Time" },
              { id: "custom", label: "Custom Range" },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetChange(preset.id as RangePreset)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  rangePreset === preset.id
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Date Range Inputs & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Start Date */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
              <Calendar size={13} className="text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setRangePreset("custom");
                }}
                className="font-mono text-slate-800 dark:text-slate-200 bg-transparent border-none focus:outline-none cursor-pointer"
              />
            </div>

            {/* End Date */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
              <Calendar size={13} className="text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setRangePreset("custom");
                }}
                className="font-mono text-slate-800 dark:text-slate-200 bg-transparent border-none focus:outline-none cursor-pointer"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 max-w-[160px] truncate cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>

            {/* Generate Button */}
            <button
              type="button"
              onClick={handleGenerateReport}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
              <span>Generate Manual Report</span>
            </button>
          </div>
        </div>

        {/* Active Filter Scope Pill Banner */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Active Scope:</span>
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-bold border border-blue-200 dark:border-blue-800/50">
              {startDate} to {endDate}
            </span>
            <span className="text-slate-400">•</span>
            <span>
              Dept: <strong>{selectedDept === "all" ? "All Departments" : selectedDept}</strong>
            </span>
            <span className="text-slate-400">•</span>
            <span>
              Projects: <strong>{selectedProject === "all" ? "All Projects" : projects.find(p => p.id === selectedProject)?.name || selectedProject}</strong>
            </span>
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            Matching: {filteredDeals.length} Deals, {filteredTasks.length} Deliverables, {filteredProjects.length} Workstreams
          </div>
        </div>
      </div>

      {/* Dynamic Filtered KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Realized Revenue</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign size={14} />
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(realizedRevenue, settings?.currency || "INR", settings?.currencySymbol || "₹")}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            <TrendingUp size={12} />
            <span>{targetPct}% of quarterly benchmark</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Open Pipeline</span>
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Layers size={14} />
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(openPipelineValue, settings?.currency || "INR", settings?.currencySymbol || "₹")}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {filteredDeals.length} active opportunities
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Task Completion</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {taskCompletionRate}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {completedTasksCount} / {filteredTasks.length} tasks resolved
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>SLA Blockers</span>
            <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <AlertTriangle size={14} />
            </span>
          </div>
          <div className={`text-lg font-bold font-mono ${slaBreaches > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
            {slaBreaches}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {slaBreaches > 0 ? "Immediate mitigation required" : "All deliverables healthy"}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Capital Burn</span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <BarChart3 size={14} />
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(totalCapitalSpent, settings?.currency || "INR", settings?.currencySymbol || "₹")}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {budgetUtilization}% of allocated budgets
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Department Headcount</span>
            <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <Users size={14} />
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {filteredEmployees.length} Members
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {selectedDept === "all" ? "Organization wide" : selectedDept}
          </div>
        </div>
      </div>

      {/* Dynamic Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Velocity Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Realized Revenue vs Target (INR)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quarterly performance tracking against approved plan
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-bold">
              INR Lakhs
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v / 100000}L`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  formatter={(val: any) => [formatCurrency(Number(val)), ""]}
                />
                <Bar dataKey="revenue" name="Actual Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Revenue Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Stage Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Sales Pipeline Opportunity Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Filtered deal volume across qualification gates
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 font-bold">
              {stageData.reduce((s, i) => s + i.value, 0)} Total Deals
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {stageData.length === 0 ? (
              <div className="text-xs text-slate-400">No deals in selected time period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                  <Legend
                    formatter={(val) => (
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-sans">
                        {val}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Project Budget vs Spent */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Project Budget Allocation vs Burn (₹ Lakhs)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Financial capital utilization per strategic initiative
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 font-bold">
              Active Projects
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="code" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}L`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  formatter={(val: any) => [`₹${val} Lakhs`, ""]}
                />
                <Bar dataKey="budget" name="Approved Budget" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" name="Capital Spent" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Capital & Headcount */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Department Headcount & Annual Operating Budget
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Operational headcount vs capital allocation
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 font-bold">
              Org Units
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="headcount" name="Staff Headcount" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="budget" name="Budget (₹ Lakhs)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filtered Deliverables & Opportunities Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Deliverables & Deals in Selected Period ({filteredDeals.length} Deals, {filteredTasks.length} Deliverables)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit view of transactions matching the active date window
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                <th className="p-3">Record Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Target Date</th>
                <th className="p-3">Value / Priority</th>
                <th className="p-3">Stage / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredDeals.slice(0, 5).map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">
                    {d.name} <span className="text-[10px] text-slate-400">({d.companyName})</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      CRM Deal
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-500">{d.expectedCloseDate}</td>
                  <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(d.amount, settings?.currency || "INR", settings?.currencySymbol || "₹")}
                  </td>
                  <td className="p-3 font-medium text-blue-600 dark:text-blue-400">{d.stage}</td>
                </tr>
              ))}
              {filteredTasks.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">
                    {t.title} <span className="text-[10px] text-slate-400">({t.projectName})</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Deliverable Task
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-500">{t.dueDate}</td>
                  <td className="p-3 font-medium">{t.priority}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      t.status === "Done" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
