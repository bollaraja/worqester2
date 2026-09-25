import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { useApp } from "../../context/AppContext";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";

export const AiOperationsAuditModal: React.FC = () => {
  const {
    isAiAuditOpen,
    setIsAiAuditOpen,
    projects,
    tasks,
    deals,
    employees,
    leaves,
    kpis,
    updateTask,
    updateProject,
  } = useApp();

  const [remediated, setRemediated] = useState<string[]>([]);

  if (!isAiAuditOpen) return null;

  // Compute live operational risk items
  const risks: Array<{
    id: string;
    title: string;
    severity: "Critical" | "High" | "Medium";
    category: "Projects" | "Tasks" | "Pipeline" | "Workload";
    impact: string;
    actionLabel: string;
    onResolve: () => void;
  }> = [];

  // Overdue tasks
  const overdue = tasks.filter((t) => t.slaBreached || (new Date(t.dueDate) < new Date() && t.status !== "Done"));
  overdue.forEach((t) => {
    risks.push({
      id: `risk-${t.id}`,
      title: `Task SLA Breach: ${t.title}`,
      severity: "Critical",
      category: "Tasks",
      impact: `Assigned to ${t.assigneeName}. Breached delivery timeline on project ${t.projectName}.`,
      actionLabel: "Extend SLA & Re-prioritize",
      onResolve: () => {
        updateTask(t.id, {
          dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
          slaBreached: false,
          priority: "High",
        });
        setRemediated((prev) => [...prev, `risk-${t.id}`]);
      },
    });
  });

  // Projects at risk
  const riskyProjects = projects.filter((p) => p.health === "At Risk" || p.health === "Critical");
  riskyProjects.forEach((p) => {
    risks.push({
      id: `risk-proj-${p.id}`,
      title: `Project Budget / Schedule Deviation: ${p.name}`,
      severity: p.health === "Critical" ? "Critical" : "High",
      category: "Projects",
      impact: `Current health is ${p.health}. Spent ₹${(p.spent / 100000).toFixed(1)}L of ₹${(p.budget / 100000).toFixed(1)}L (${Math.round((p.spent / p.budget) * 100)}%).`,
      actionLabel: "Recalibrate to Watch & Inject Buffer",
      onResolve: () => {
        updateProject(p.id, { health: "Watch" });
        setRemediated((prev) => [...prev, `risk-proj-${p.id}`]);
      },
    });
  });

  // Overloaded employees
  const overloadedEmps = employees.filter((e) => e.loggedHoursThisWeek > 40);
  overloadedEmps.forEach((e) => {
    risks.push({
      id: `risk-emp-${e.id}`,
      title: `Resource Burnout Hazard: ${e.fullName}`,
      severity: "High",
      category: "Workload",
      impact: `Logged ${e.loggedHoursThisWeek}h this week against 40h standard. Capacity at ${Math.round((e.loggedHoursThisWeek / 40) * 100)}%.`,
      actionLabel: "Dispatch Workload Rebalance Notice",
      onResolve: () => {
        setRemediated((prev) => [...prev, `risk-emp-${e.id}`]);
      },
    });
  });

  // Pending leaves accumulation
  const pendingLeaves = leaves.filter((l) => l.status === "Pending");
  if (pendingLeaves.length > 2) {
    risks.push({
      id: "risk-leaves",
      title: `${pendingLeaves.length} Leave Applications Awaiting HR Approval`,
      severity: "Medium",
      category: "Workload",
      impact: "May induce sprint unpredictability and team dissatisfaction.",
      actionLabel: "Review in Leave Management",
      onResolve: () => {
        setIsAiAuditOpen(false);
      },
    });
  }

  const activeRisks = risks.filter((r) => !remediated.includes(r.id));

  return (
    <Modal
      isOpen={isAiAuditOpen}
      onClose={() => setIsAiAuditOpen(false)}
      title="AI Operations & Risk Audit"
      subtitle="Autonomous synthesis of bottlenecks, SLA violations, budget slippage, and burnout vectors"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Score Summary Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg font-mono border ${
                kpis.businessHealthScore >= 80
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : kpis.businessHealthScore >= 60
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
              }`}
            >
              {kpis.businessHealthScore}
            </div>
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <span>Enterprise Stability Index:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono ${
                    kpis.businessHealthStatus === "Healthy"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : kpis.businessHealthStatus === "Watch"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  {kpis.businessHealthStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeRisks.length === 0
                  ? "All systems, tasks, and project baselines operating within green tolerances."
                  : `${activeRisks.length} active operational anomalies detected across modules.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
            <Sparkles size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Real-time Diagnostic</span>
          </div>
        </div>

        {/* Risk Items List */}
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {activeRisks.length > 0 ? (
            activeRisks.map((risk) => (
              <div
                key={risk.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        risk.severity === "Critical"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : risk.severity === "High"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {risk.severity}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      [{risk.category}]
                    </span>
                    <h4 className="font-semibold text-white tracking-tight">{risk.title}</h4>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {risk.impact}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={risk.onResolve}
                  className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 active:scale-95"
                >
                  <Zap size={13} className="text-amber-400" />
                  <span>{risk.actionLabel}</span>
                </button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
              <h4 className="text-sm font-bold text-white">All Operational Anomalies Cleared!</h4>
              <p className="text-xs text-slate-400 mt-1">
                Worqester's automated safety triggers and remediation actions have stabilized all workflows.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Continuous background telemetry enabled</span>
          <button
            type="button"
            onClick={() => setIsAiAuditOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </Modal>
  );
};
