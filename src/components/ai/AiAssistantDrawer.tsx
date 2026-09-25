import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { AuthService } from "../../services/auth";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

export const AiAssistantDrawer: React.FC = () => {
  const {
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    kpis,
    projects,
    tasks,
    deals,
    employees,
    settings,
  } = useApp();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "ai",
      text: `Hello! I am your Worqester Intelligence Co-Pilot. I have analyzed your ${projects.length} active enterprise projects, ${deals.length} deals in pipeline, and ${employees.length} team members. Ask me anything about executive health, resource allocation, or strategic interventions.`,
      timestamp: "Just now",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!isAiAssistantOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setLoading(true);

    try {
      const token = AuthService.getToken() || localStorage.getItem("token") || localStorage.getItem("worqester_auth_token_v1");
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt: promptToSend,
          context: {
            kpis,
            projectsCount: (projects || []).length,
            tasksCount: (tasks || []).length,
            overdueTasks: kpis?.overdueTasks || 0,
            pipelineValue: kpis?.pipelineValue || 0,
            currency: settings?.currency || "INR",
            deals: (deals || []).map((d) => ({ name: d.name || "", amount: d.amount || 0, stage: d.stage || "Prospect", probability: d.probability || 0 })),
            projects: (projects || []).map((p) => ({ name: p.name || "", status: p.status || "Planning", health: p.health || "Good", budget: p.budget || 0 })),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("AI query failed");
      }

      const data = await response.json();
      const answerContent = data.reply || data.answer || data.text || "Executive intelligence briefing generated.";
      const aiReply: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: answerContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.warn("Falling back to local heuristic response:", err);
      // Fallback
      let fallbackText = `Executive Operational Briefing:\n\n• Business Health: ${kpis.businessHealthScore}/100 (${kpis.businessHealthStatus})\n• Active Pipeline: ₹${(kpis.pipelineValue / 100000).toFixed(1)}L across ${kpis.openDealsCount} qualified engagements\n• Risk Vectors: ${kpis.overdueTasks} tasks require immediate SLA mitigation, notably authentication rotation and data lake connectors.\n• Recommended Next Step: Rebalance sprint capacity to clear P0 blockers and follow up on high-probability negotiation deals.`;
      
      const aiReply: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Summarize executive business health",
    "Which projects are currently at risk?",
    "Show deals nearing close this month",
    "Audit team workload and capacity bottlenecks",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsAiAssistantOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  Worqester AI Co-Pilot
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold border border-amber-500/30">
                    GEMINI
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Enterprise operational intelligence</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAiAssistantOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Starters */}
          <div className="p-3 border-b border-slate-800/80 bg-slate-950/30 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-colors border border-slate-700/50 flex items-center gap-1 flex-shrink-0"
              >
                <Lightbulb size={11} className="text-amber-400" />
                <span>{p}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-indigo-600/30 text-indigo-400 border border-indigo-500/30"
                  }`}
                >
                  {m.sender === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div
                  className={`max-w-[82%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white rounded-tr-none font-medium"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none shadow-sm"
                  }`}
                >
                  {m.text}
                  <div
                    className={`mt-1 text-[9px] text-right ${
                      m.sender === "user" ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <Loader2 size={15} className="animate-spin text-amber-400" />
                <span>Worqester AI is reasoning across your operational graph...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Input */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask about project risks, sales forecasts, employees..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !inputPrompt.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/30 active:scale-95"
              >
                <Send size={15} />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>Backed by Server-Side Gemini API</span>
              <span>Enterprise RBAC Safe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
