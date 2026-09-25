import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { DataTable, Column } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { PriorityBadge } from "../components/common/PriorityBadge";
import { formatCurrency, formatDate } from "../utils/formatters";
import {
  Building2,
  Users,
  Briefcase,
  DollarSign,
  Plus,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Calendar,
  Layers,
  FileCheck,
  CheckCircle2,
  Trash2,
  Pencil,
  Search,
  Filter,
} from "lucide-react";
import { Lead, Deal, Company, Contact } from "../types";
import { EditDealModal, EditLeadModal, EditCompanyModal, EditContactModal } from "../components/modals/EditModals";

export const CrmView: React.FC = () => {
  const {
    currentSubView,
    navigateTo,
    openCreateModal,
    leads,
    deals,
    companies,
    contacts,
    activities,
    projects,
    updateDeal,
    updateLead,
    updateCompany,
    updateContact,
    deleteItem,
    settings,
    selectedEntityId,
  } = useApp();

  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Pipeline search and filter
  const [pipelineSearch, setPipelineSearch] = useState("");
  const [pipelinePriority, setPipelinePriority] = useState("all");

  // Active tab within CRM
  const activeSubView = currentSubView === "deals" ? "pipeline" : (currentSubView || "pipeline");

  // Deals Kanban columns
  const dealStages = [
    "New",
    "Qualification",
    "Discovery",
    "Proposal",
    "Negotiation",
    "Closed Won",
  ];

  const handleAdvanceDeal = (deal: Deal, nextStage: any) => {
    updateDeal(deal.id, {
      stage: nextStage,
      probability: nextStage === "Closed Won" ? 100 : deal.probability + 15,
    });
  };

  const handleConvertLead = (lead: Lead) => {
    updateLead(lead.id, { status: "Qualified" });
    openCreateModal("deal");
  };

  // Customer 360 target account
  const customer360Company =
    companies.find((c) => c.id === selectedEntityId) || companies[0] || null;

  // Lead Columns
  const leadColumns: Column<Lead>[] = [
    {
      key: "name",
      header: "Lead Contact",
      sortable: true,
      render: (lead) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{lead.name}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{lead.company}</div>
        </div>
      ),
    },
    {
      key: "industry",
      header: "Industry",
      sortable: true,
      render: (l) => <span className="text-slate-700 dark:text-slate-300">{l.industry}</span>,
    },
    {
      key: "score",
      header: "Lead Score",
      sortable: true,
      render: (l) => (
        <span
          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full border ${
            l.score >= 80
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : l.score >= 60
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
          }`}
        >
          {l.score}/100
        </span>
      ),
    },
    {
      key: "expectedValue",
      header: "Est. Value",
      sortable: true,
      render: (l) => (
        <span className="font-mono font-semibold text-slate-200">
          {formatCurrency(l.expectedValue, settings?.currency || "INR", settings?.currencySymbol || "₹")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (l) => <StatusBadge status={l.status} size="sm" />,
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      render: (l) => <PriorityBadge priority={l.priority} size="sm" />,
    },
    {
      key: "ownerName",
      header: "Assigned To",
      sortable: true,
      render: (l) => <span className="text-slate-400 text-xs">{l.ownerName}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (l) => (
        <div className="flex items-center gap-1.5">
          {l.status !== "Qualified" && (
            <button
              type="button"
              onClick={() => handleConvertLead(l)}
              className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[10px] font-semibold transition-colors"
            >
              Convert to Deal
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditingLead(l)}
            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
            title="Edit Lead"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => deleteItem("lead", l.id)}
            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  // Company Columns
  const companyColumns: Column<Company>[] = [
    {
      key: "name",
      header: "Account / Company",
      sortable: true,
      render: (c) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.website}</div>
        </div>
      ),
    },
    {
      key: "industry",
      header: "Industry",
      sortable: true,
      render: (c) => <span className="text-slate-700 dark:text-slate-300">{c.industry}</span>,
    },
    {
      key: "tier",
      header: "Client Tier",
      sortable: true,
      render: (c) => (
        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
          {c.tier || "Enterprise"}
        </span>
      ),
    },
    {
      key: "annualRevenue",
      header: "Account Revenue",
      sortable: true,
      render: (c) => (
        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
          {formatCurrency(c.annualRevenue, settings?.currency || "INR", settings?.currencySymbol || "₹")}
        </span>
      ),
    },
    {
      key: "location",
      header: "Headquarters",
      sortable: true,
      render: (c) => <span className="text-slate-600 dark:text-slate-300">{c.location || c.address || "Bengaluru, India"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (c) => <StatusBadge status={c.status || c.health} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigateTo("crm", "customer360", c.id)}
            className="flex items-center gap-0.5 text-xs text-blue-500 hover:text-blue-400 font-semibold px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
            title="Customer 360 View"
          >
            <span>360°</span>
            <ChevronRight size={13} />
          </button>
          <button
            type="button"
            onClick={() => setEditingCompany(c)}
            className="p-1.5 rounded text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit Company"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete company account "${c.name}"?`)) {
                deleteItem("company", c.id);
              }
            }}
            className="p-1.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Delete Company"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  // Contact Columns
  const contactColumns: Column<Contact>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (cont) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{cont.name}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{cont.title || cont.designation}</div>
        </div>
      ),
    },
    {
      key: "companyName",
      header: "Company",
      sortable: true,
      render: (cont) => <span className="text-slate-700 dark:text-slate-300">{cont.companyName}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (cont) => (
        <a
          href={`mailto:${cont.email}`}
          className="flex items-center gap-1.5 text-blue-500 hover:underline"
        >
          <Mail size={12} />
          <span>{cont.email}</span>
        </a>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (cont) => (
        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono">
          <Phone size={12} />
          <span>{cont.phone}</span>
        </span>
      ),
    },
    {
      key: "decisionMaker",
      header: "Decision Role",
      render: (cont) =>
        cont.decisionMaker ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 font-semibold">
            Key Stakeholder
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">Influencer</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (cont) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEditingContact(cont)}
            className="p-1.5 rounded text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit Contact"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete contact "${cont.name}"?`)) {
                deleteItem("contact", cont.id);
              }
            }}
            className="p-1.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Delete Contact"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Sub Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: "pipeline", label: "Sales Pipeline", count: deals.length },
            { id: "leads", label: "Leads & Inbound", count: leads.length },
            { id: "companies", label: "Accounts (Companies)", count: companies.length },
            { id: "contacts", label: "Contacts", count: contacts.length },
            { id: "customer360", label: "Customer 360", count: null },
            { id: "activities", label: "Sales Activities", count: activities.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateTo("crm", tab.id)}
              className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeSubView === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeSubView === tab.id
                      ? "bg-blue-700 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {activeSubView === "pipeline" || activeSubView === "deals" ? (
            <div className="flex items-center flex-wrap gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={pipelineSearch}
                  onChange={(e) => setPipelineSearch(e.target.value)}
                  placeholder="Filter deals..."
                  className="pl-7 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
                />
              </div>
              <select
                value={pipelinePriority}
                onChange={(e) => setPipelinePriority(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <button
                type="button"
                onClick={() => openCreateModal("deal")}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Deal</span>
              </button>
            </div>
          ) : activeSubView === "leads" ? (
            <button
              type="button"
              onClick={() => openCreateModal("lead")}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus size={14} />
              <span>Add Lead</span>
            </button>
          ) : activeSubView === "companies" ? (
            <button
              type="button"
              onClick={() => openCreateModal("company")}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus size={14} />
              <span>Add Company</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* VIEW: SALES PIPELINE (KANBAN) */}
      {activeSubView === "pipeline" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Total Pipeline Value:{" "}
              <strong className="text-white font-mono text-sm">
                {formatCurrency(
                  deals
                    .filter((d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost")
                    .reduce((s, d) => s + d.amount, 0),
                  settings?.currency || "INR",
                  settings?.currencySymbol || "₹"
                )}
              </strong>
            </span>
            <span>Weighted Forecast: <strong className="text-blue-400 font-mono">
              {formatCurrency(
                deals
                  .filter((d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost")
                  .reduce((s, d) => s + (d.amount * d.probability) / 100, 0),
                settings?.currency || "INR",
                settings?.currencySymbol || "₹"
              )}
            </strong></span>
          </div>

          {/* Kanban Board Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
            {dealStages.map((stage) => {
              let stageDeals = deals.filter((d) => d.stage === stage);
              if (pipelineSearch.trim()) {
                const q = pipelineSearch.toLowerCase();
                stageDeals = stageDeals.filter(
                  (d) =>
                    (d.name || "").toLowerCase().includes(q) ||
                    (d.companyName || "").toLowerCase().includes(q)
                );
              }
              if (pipelinePriority !== "all") {
                stageDeals = stageDeals.filter((d) => d.priority === pipelinePriority);
              }
              const stageValue = stageDeals.reduce((sum, d) => sum + d.amount, 0);

              return (
                <div
                  key={stage}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="pb-2.5 mb-2.5 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">
                        {stage}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatCurrency(stageValue, settings?.currency || "INR", settings?.currencySymbol || "₹")}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                      {stageDeals.length}
                    </span>
                  </div>

                  {/* Deals in Stage */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                    {stageDeals.length === 0 ? (
                      <div className="text-center py-8 text-[11px] text-slate-500 border border-dashed border-slate-800/80 rounded-xl">
                        No deals
                      </div>
                    ) : (
                      stageDeals.map((deal) => {
                        const stageIndex = dealStages.indexOf(stage);

                        return (
                          <div
                            key={deal.id}
                            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all text-xs group shadow-sm space-y-2"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <span
                                onClick={() => setEditingDeal(deal)}
                                className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer"
                                title="Click to edit deal"
                              >
                                {deal.name}
                              </span>
                              <PriorityBadge priority={deal.priority} size="sm" />
                            </div>

                            <div className="text-[11px] text-slate-400 truncate">
                              {deal.companyName}
                            </div>

                            <div className="flex items-baseline justify-between text-xs pt-1.5 border-t border-slate-800/60">
                              <span className="font-mono font-bold text-emerald-400">
                                {formatCurrency(deal.amount, settings?.currency || "INR", settings?.currencySymbol || "₹")}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {deal.probability}% Prob.
                              </span>
                            </div>

                            {/* Bi-Directional Workflow Controls + Prominent Edit/Delete */}
                            <div className="pt-2 border-t border-slate-800/50 flex flex-col gap-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 font-mono flex items-center gap-1">
                                  <Calendar size={10} className="text-slate-500" />
                                  {deal.expectedCloseDate}
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingDeal(deal)}
                                    className="p-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer border border-blue-500/20"
                                    title="Edit Deal"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Delete deal "${deal.name}"?`)) {
                                        deleteItem("deal", deal.id);
                                      }
                                    }}
                                    className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer border border-rose-500/20"
                                    title="Delete Deal"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>

                              {/* Navigation Buttons: Prev & Next */}
                              <div className="flex items-center justify-between gap-1 pt-1">
                                {stageIndex > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceDeal(deal, dealStages[stageIndex - 1])}
                                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-semibold flex items-center gap-0.5 cursor-pointer"
                                    title={`Move back to ${dealStages[stageIndex - 1]}`}
                                  >
                                    <ArrowLeft size={10} />
                                    <span>Prev</span>
                                  </button>
                                ) : (
                                  <span />
                                )}

                                {stageIndex < dealStages.length - 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceDeal(deal, dealStages[stageIndex + 1])}
                                    className="text-[10px] px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white transition-colors font-semibold flex items-center gap-0.5 cursor-pointer ml-auto"
                                    title={`Advance to ${dealStages[stageIndex + 1]}`}
                                  >
                                    <span>Next</span>
                                    <ArrowRight size={10} />
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-400 ml-auto">Won</span>
                                )}
                              </div>
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
        </div>
      )}

      {/* VIEW: LEADS */}
      {activeSubView === "leads" && (
        <DataTable
          data={leads}
          columns={leadColumns}
          searchPlaceholder="Search leads by contact name, company, industry..."
          searchField={(l) => `${l.name} ${l.company} ${l.industry}`}
        />
      )}

      {/* VIEW: COMPANIES */}
      {activeSubView === "companies" && (
        <DataTable
          data={companies}
          columns={companyColumns}
          searchPlaceholder="Search company accounts..."
          searchField={(c) => `${c.name} ${c.industry} ${c.address || c.location || ""}`}
        />
      )}

      {/* VIEW: CONTACTS */}
      {activeSubView === "contacts" && (
        <DataTable
          data={contacts}
          columns={contactColumns}
          searchPlaceholder="Search contacts by name, email, company..."
          searchField={(cont) => `${cont.name} ${cont.email} ${cont.companyName}`}
        />
      )}

      {/* VIEW: CUSTOMER 360 */}
      {activeSubView === "customer360" && !customer360Company && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-8 text-center space-y-3">
          <Building2 size={32} className="mx-auto text-slate-500" />
          <h3 className="text-sm font-bold text-white">No Enterprise Accounts Available</h3>
          <p className="text-xs text-slate-400">Create a company account first to view 360 operational analytics.</p>
          <button
            type="button"
            onClick={() => openCreateModal("company")}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            + Create Company Account
          </button>
        </div>
      )}

      {activeSubView === "customer360" && customer360Company && (
        <div className="space-y-6">
          {/* Account Profile Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-extrabold text-2xl shadow-inner">
                {customer360Company.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {customer360Company.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    Tier: {customer360Company.tier || "Tier 1 Enterprise"}
                  </span>
                  <StatusBadge status={customer360Company.status || customer360Company.health} size="sm" />
                </div>
                <p className="text-xs text-slate-400">
                  {customer360Company.industry} • Headquarters in {customer360Company.address || customer360Company.location || "Bengaluru, India"} •{" "}
                  {customer360Company.website}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs font-mono text-slate-300">
                  <span>
                    Annual Revenue:{" "}
                    <strong className="text-emerald-400">
                      {formatCurrency(customer360Company.annualRevenue)}
                    </strong>
                  </span>
                  <span>Employees: 1,200+</span>
                  <span>Client Since: 2024</span>
                </div>
              </div>
            </div>

            {/* Quick Switch Accounts */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Switch Account:</span>
              <select
                value={customer360Company.id}
                onChange={(e) => navigateTo("crm", "customer360", e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 360 Grid: Deals, Active Projects, Key Contacts, and Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deals with this Account */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-400" />
                  <span>Pipeline & Active Deals</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {deals.filter((d) => d.companyId === customer360Company.id).length} Active
                </span>
              </div>

              <div className="space-y-2.5">
                {deals
                  .filter((d) => d.companyId === customer360Company.id)
                  .map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{deal.name}</span>
                        <StatusBadge status={deal.stage} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="font-mono font-bold text-emerald-400">
                          {formatCurrency(deal.amount)}
                        </span>
                        <span>{deal.probability}% Probability</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Projects with this Account */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-purple-400" />
                  <span>Delivering Projects</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {projects.filter((p) => p.companyId === customer360Company.id).length} Projects
                </span>
              </div>

              <div className="space-y-2.5">
                {projects
                  .filter((p) => p.companyId === customer360Company.id)
                  .map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{proj.name}</span>
                        <StatusBadge status={proj.health} size="sm" />
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{proj.progress}% Done</span>
                        <span>Budget: {formatCurrency(proj.budget)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Key Contacts */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users size={16} className="text-blue-400" />
                  <span>Key Stakeholders</span>
                </h3>
                <button
                  type="button"
                  onClick={() => openCreateModal("contact")}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-2.5">
                {contacts
                  .filter((c) => c.companyId === customer360Company.id)
                  .map((cont) => (
                    <div
                      key={cont.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{cont.name}</span>
                        {cont.decisionMaker && (
                          <span className="text-[10px] text-amber-400 font-mono">
                            Decision Maker
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{cont.title}</div>
                      <div className="text-[11px] text-blue-400 font-mono">{cont.email}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ACTIVITIES */}
      {activeSubView === "activities" && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Sales & Customer Engagements</h3>
              <p className="text-xs text-slate-400">All customer calls, meetings, notes, and touchpoints</p>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal("note")}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Log Touchpoint
            </button>
          </div>

          <div className="space-y-3 divide-y divide-slate-800/60">
            {(activities || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No customer touchpoints logged yet.</p>
            ) : (
              (activities || []).map((act) => (
                <div key={act.id || Math.random()} className="pt-3 first:pt-0 flex items-start gap-3.5 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-blue-400 font-bold">
                    {act.type === "Call" ? "📞" : act.type === "Meeting" ? "🗓️" : "📝"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{act.title || "Untitled Engagement"}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{act.timestamp || ""}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{act.description || "No description provided."}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                      <span>Logged by {act.userName || "Team Member"}</span>
                      {act.entityType && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400">{act.entityType}: {act.entityName || "General"}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Deal Modal */}
      {editingDeal && (
        <EditDealModal
          deal={editingDeal}
          isOpen={true}
          onClose={() => setEditingDeal(null)}
          onSave={(updated) => {
            updateDeal(editingDeal.id, updated);
            setEditingDeal(null);
          }}
        />
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          isOpen={true}
          onClose={() => setEditingLead(null)}
          onSave={(updated) => {
            updateLead(editingLead.id, updated);
            setEditingLead(null);
          }}
        />
      )}

      {/* Edit Company Modal */}
      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          isOpen={true}
          onClose={() => setEditingCompany(null)}
          onSave={(updated) => {
            updateCompany(editingCompany.id, updated);
            setEditingCompany(null);
          }}
        />
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <EditContactModal
          contact={editingContact}
          isOpen={true}
          onClose={() => setEditingContact(null)}
          onSave={(updated) => {
            updateContact(editingContact.id, updated);
            setEditingContact(null);
          }}
        />
      )}
    </div>
  );
};
