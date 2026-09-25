import React from "react";
import { useApp } from "../context/AppContext";
import { Users, Clock, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

export const TeamWorkloadView: React.FC = () => {
  const { employees, tasks, projects } = useApp();

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Team Capacity & Workload Balance
          </h2>
          <p className="text-xs text-slate-400">
            Real-time sprint allocation vs standard 40 hours/week threshold
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {employees.map((emp) => {
          const empTasks = tasks.filter((t) => t.assigneeId === emp.id && t.status !== "Done");
          const percentage = Math.round((emp.loggedHoursThisWeek / emp.capacityHoursPerWeek) * 100);
          const isOverloaded = percentage > 100;
          const isOptimal = percentage >= 75 && percentage <= 100;

          return (
            <div
              key={emp.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm space-y-4 text-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={emp.avatar}
                    alt={emp.fullName}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-blue-500/30"
                  />
                  <div>
                    <h4 className="font-bold text-white">{emp.fullName}</h4>
                    <p className="text-[11px] text-slate-400">{emp.designation}</p>
                    <span className="text-[10px] text-blue-400 font-mono">{emp.department}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    isOverloaded
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : isOptimal
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  }`}
                >
                  {isOverloaded ? "Overloaded" : isOptimal ? "Optimal" : "Available"}
                </span>
              </div>

              {/* Capacity Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Weekly Utilization</span>
                  <span
                    className={`font-bold ${
                      isOverloaded ? "text-rose-400" : isOptimal ? "text-emerald-400" : "text-blue-400"
                    }`}
                  >
                    {emp.loggedHoursThisWeek}h / {emp.capacityHoursPerWeek}h ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOverloaded ? "bg-rose-500" : isOptimal ? "bg-emerald-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
              </div>

              {/* Active Assigned Tasks */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                <span className="font-semibold text-slate-400 text-[10px] uppercase">
                  Active Sprint Deliverables ({empTasks.length})
                </span>
                <div className="space-y-1">
                  {empTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-200 truncate">{t.title}</span>
                      <span className="text-[10px] font-mono text-slate-500 flex-shrink-0 ml-2">
                        {t.estimatedHours}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
