import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { formatCurrency } from "../utils/formatters";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  BrainCircuit,
  Bot,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Sliders,
  Play,
  Plus,
} from "lucide-react";

export const AiIntelligenceView: React.FC = () => {
  const {
    currentSubView,
    navigateTo,
    kpis,
    projects,
    tasks,
    deals,
    employees,
    automations,
    setIsAiAssistantOpen,
    setIsAiAuditOpen,
    updateTask,
  } = useApp();

  const activeSubView = currentSubView || "insights";
  const [smartPrioritized, setSmartPrioritized] = useState(false);

  // Compute smart prioritization recommendations
  const recommendedPriorities = tasks
    .filter((t) => t.status !== "Done")
    .map((task) => {
      let score = 50;
      if (task.slaBreached) score += 40;
      if (task.priority === "Critical") score += 30;
      if (task.priority === "High") score += 20;
      if (new Date(task.dueDate) < new Date(Date.now() + 3 * 86400000)) score += 25;

      return {
        ...task,
        aiScore: Math.min(99, score),
        recommendedPriority: score >= 80 ? "Critical" : score >= 60 ? "High" : "Medium",
        reason: task.slaBreached
          ? "SLA breach detected. High impact on client timeline."
          : score >= 80
          ? "Due within 72 hours on revenue-critical project deliverable."
          : "Standard operational deliverable.",
      };
    })
    .sort((a, b) => b.aiScore - a.aiScore);

  const applySmartPriorities = () => {
    recommendedPriorities.forEach((item) => {
      if (item.priority !== item.recommendedPriority) {
        updateTask(item.id, { priority: item.recommendedPriority as any });
      }
    });
    setSmartPrioritized(true);
    setTimeout(() => setSmartPrioritized(false), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Sub Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: "insights", label: "Executive AI Insights" },
            { id: "smart-priority", label: "AI Smart Priority" },
            { id: "audit", label: "AI Operations Audit" },
            { id: "automations", label: "Automations Engine" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateTo("ai", tab.id)}
              className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeSubView === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80"
              }`}
            >
              <Sparkles size={14} className={activeSubView === tab.id ? "text-amber-300" : "text-slate-400"} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsAiAssistantOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
        >
          <Bot size={14} />
          <span>Launch AI Co-Pilot</span>
        </button>
      </div>

      {/* VIEW: EXECUTIVE INSIGHTS */}
      {activeSubView === "insights" && (
        <div className="space-y-6">
          {/* Executive Synthesis Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
                  <BrainCircuit size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Worqester Autonomous Operational Briefing
                  </h3>
                  <span className="text-[11px] text-indigo-300 font-mono">
                    Model: Gemini 2.5 Flash Enterprise Reasoning Engine
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/30">
                Confidence: 96.8%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <TrendingUp size={16} />
                  <span>Revenue Velocity & Expansion</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Pipeline health is robust with ₹{formatCurrency(kpis.pipelineValue)} across {kpis.openDealsCount} qualified engagements. The 85% probability deal with Acme Global is primed for closing this month.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertCircle size={16} />
                  <span>SLA & Execution Guardrails</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {kpis.overdueTasks} task has breached delivery threshold. Recommend reassigning authentication rotation milestones to buffer sprint finish.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <ShieldCheck size={16} />
                  <span>Headcount & Capacity Balance</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Engineering utilization is running at 94%. With {kpis.openPositionsCount} requisitions open, fast-tracking the Senior Cloud Architect offer will mitigate Q4 strain.
                </p>
              </div>
            </div>
          </div>

          {/* Strategic Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Automated Deal Acceleration</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                  High Impact
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Proposal stage deals have averaged 14 days in negotiation. Auto-generating standardized SLA and NDA terms can reduce sales friction by 35%.
              </p>
              <button
                type="button"
                onClick={() => navigateTo("crm", "pipeline")}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5"
              >
                <span>Review Active Pipeline</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Sprint Milestone Rebalancing</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
                  Recommended
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Task "NextGen Microservices Refactor" contains 3 interdependent blockers. Worqester AI has mapped a critical path sequence.
              </p>
              <button
                type="button"
                onClick={() => navigateTo("tasks", "kanban")}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5"
              >
                <span>Open Task Kanban</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SMART PRIORITY */}
      {activeSubView === "smart-priority" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Sliders size={16} className="text-indigo-400" />
                <span>AI Algorithmic Task Re-prioritization</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ranks all deliverables dynamically based on SLA proximity, project health, and contract revenue
              </p>
            </div>

            <button
              type="button"
              onClick={applySmartPriorities}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all self-end sm:self-auto active:scale-95"
            >
              <Sparkles size={14} className="text-amber-300" />
              <span>Apply AI Priorities to Board</span>
            </button>
          </div>

          {smartPrioritized && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} />
              <span>Tasks re-prioritized successfully! Priority badges have been updated across views.</span>
            </div>
          )}

          <div className="space-y-3">
            {recommendedPriorities.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                      Score: {item.aiScore}/100
                    </span>
                    <h4 className="font-semibold text-white truncate">{item.title}</h4>
                  </div>
                  <div className="text-slate-400 text-[11px] flex items-center gap-3">
                    <span>{item.projectName}</span>
                    <span>•</span>
                    <span>Assigned to {item.assigneeName}</span>
                    <span>•</span>
                    <span className="text-indigo-300">{item.reason}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Current vs Recommended</span>
                    <span className="font-bold text-white font-mono">
                      {item.priority} → <strong className="text-amber-400">{item.recommendedPriority}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: AUDIT */}
      {activeSubView === "audit" && (
        <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-4">
          <ShieldCheck size={40} className="mx-auto text-indigo-400" />
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">Full Operations & SLA Diagnostic</h3>
            <p className="text-xs text-slate-400 mt-1">
              Launches an autonomous audit across all active projects, employee capacity buffers, and contract commitments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAiAuditOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            Launch Live Operations Audit
          </button>
        </div>
      )}

      {/* VIEW: AUTOMATIONS ENGINE */}
      {activeSubView === "automations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Trigger-Action Automation Rules</h3>
              <p className="text-xs text-slate-400">Autonomous workflow orchestration for tasks, deals, and HR approvals</p>
            </div>
          </div>

          <div className="space-y-3">
            {automations.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{rule.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {rule.category}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] font-mono">
                    <span className="text-blue-400 font-semibold">WHEN:</span> {rule.trigger} •{" "}
                    <span className="text-indigo-400 font-semibold">THEN:</span> {rule.action}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Last triggered: {rule.lastTriggered} • {rule.executionCount} executions
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                      rule.active
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {rule.active ? "Active" : "Paused"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
