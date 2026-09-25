import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { DataTable, Column } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../utils/formatters";
import {
  Users,
  Building2,
  Clock,
  Calendar,
  UserCheck,
  Briefcase,
  DollarSign,
  Plus,
  CheckCircle2,
  XCircle,
  FileText,
  Shield,
  Laptop,
  Check,
  Download,
  Trash2,
  Pencil,
  ArrowRight,
  Star,
} from "lucide-react";
import { Employee, AttendanceRecord, LeaveRequest, JobPosition, Candidate, Expense, Asset } from "../types";
import { EditEmployeeModal, AddAssetModal, AddCandidateModal, EditAssetModal } from "../components/modals/EditModals";
import { generatePayslipPDF } from "../utils/payslipGenerator";

export const HrmView: React.FC = () => {
  const {
    currentSubView,
    navigateTo,
    openCreateModal,
    employees,
    departments,
    attendance,
    leaves,
    positions,
    candidates,
    expenses,
    assets,
    updateLeaveStatus,
    updateExpenseStatus,
    updateEmployee,
    createAsset,
    updateAsset,
    deleteAsset,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    checkInCurrentUser,
    checkOutCurrentUser,
    currentUser,
    settings,
    kpis,
    deleteItem,
  } = useApp();

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);

  const isEmployee = currentUser.role === "Employee";
  const activeSubView = currentSubView || (isEmployee ? "self-service" : "dashboard");
  const [filterDept, setFilterDept] = useState("all");

  const filteredEmployees = employees.filter((e) => {
    if (filterDept !== "all" && e.department !== filterDept) return false;
    return true;
  });

  // Employee columns
  const employeeColumns: Column<Employee>[] = [
    {
      key: "fullName",
      header: "Employee & ID",
      sortable: true,
      render: (emp) => (
        <div className="flex items-center gap-3">
          <img
            src={emp.avatar}
            alt={emp.fullName}
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-blue-500/30"
          />
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">{emp.fullName}</div>
            <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
              {emp.employeeNumber} • {emp.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "designation",
      header: "Designation & Dept",
      sortable: true,
      render: (emp) => (
        <div>
          <div className="text-slate-800 dark:text-slate-200 font-medium">{emp.designation}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{emp.department}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (emp) => <StatusBadge status={emp.status} size="sm" />,
    },
    {
      key: "workMode",
      header: "Work Mode",
      sortable: true,
      render: (emp) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {emp.workMode}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      sortable: true,
      render: (emp) => <span className="text-slate-600 dark:text-slate-400">{emp.location}</span>,
    },
    {
      key: "salaryBasic",
      header: "Compensation (Monthly)",
      sortable: true,
      render: (emp) => (
        <div className="font-mono">
          <span className="text-slate-900 dark:text-slate-200 font-semibold">
            {formatCurrency(emp.salaryBasic, settings?.currency || "INR", settings?.currencySymbol || "₹")}
          </span>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">{emp.bankAccountMasked}</div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (emp) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEditingEmployee(emp)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit Employee Profile"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => deleteItem("employee", emp.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Delete Employee"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  // Attendance columns
  const attendanceColumns: Column<AttendanceRecord>[] = [
    {
      key: "employeeName",
      header: "Employee",
      sortable: true,
      render: (att) => <span className="font-semibold text-white">{att.employeeName}</span>,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (att) => <span className="font-mono text-slate-400">{att.date}</span>,
    },
    {
      key: "checkIn",
      header: "Check-In",
      render: (att) => (
        <span className="font-mono text-emerald-400 font-semibold">{att.checkIn || "—"}</span>
      ),
    },
    {
      key: "checkOut",
      header: "Check-Out",
      render: (att) => (
        <span className="font-mono text-slate-400">{att.checkOut || "Active In Office"}</span>
      ),
    },
    {
      key: "totalHours",
      header: "Hours Logged",
      render: (att) => (
        <span className="font-mono text-slate-300 font-bold">{att.totalHours}h</span>
      ),
    },
    {
      key: "workMode",
      header: "Mode",
      render: (att) => (
        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
          {att.workMode}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (att) => <StatusBadge status={att.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Sub Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          {(isEmployee
            ? [
                { id: "self-service", label: "My Self-Service Portal", count: null },
                { id: "attendance", label: "My Attendance Log", count: null },
                { id: "leave", label: "My Leave Requests", count: leaves.filter((l) => l.employeeName === currentUser.name || l.employeeId === currentUser.id).length },
                { id: "expenses", label: "My Expense Claims", count: expenses.filter((e) => e.employeeName === currentUser.name).length },
                { id: "employees", label: "Company Directory", count: employees.length },
                { id: "departments", label: "Departments & Org Chart", count: departments.length },
                { id: "assets", label: "My Allocated Assets", count: assets.filter((a) => a.assignedToName === currentUser.name).length },
              ]
            : [
                { id: "dashboard", label: "HR Dashboard", count: null },
                { id: "employees", label: "Employees Directory", count: employees.length },
                { id: "departments", label: "Departments & Org Chart", count: departments.length },
                { id: "attendance", label: "Attendance Log", count: attendance.length },
                { id: "leave", label: "Leave Requests", count: kpis.pendingLeaves },
                { id: "recruitment", label: "Recruitment (ATS)", count: kpis.openPositionsCount },
                { id: "self-service", label: "Employee Self-Service", count: null },
                { id: "expenses", label: "Expenses Claims", count: expenses.length },
                { id: "assets", label: "Asset Allocation", count: assets.length },
              ]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateTo("hrm", tab.id)}
              className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeSubView === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {activeSubView === "employees" && (
            <button
              type="button"
              onClick={() => openCreateModal("employee")}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Add Employee</span>
            </button>
          )}
          {activeSubView === "leave" && (
            <button
              type="button"
              onClick={() => openCreateModal("leave")}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Apply Leave</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW: HR DASHBOARD & DEPARTMENTS */}
      {(activeSubView === "dashboard" || activeSubView === "departments") && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Headcount</span>
                <div className="text-2xl font-black text-white mt-1 font-mono">{employees.length}</div>
                <div className="text-[11px] text-emerald-400 mt-1">100% active roster</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Present Today</span>
                <div className="text-2xl font-black text-white mt-1 font-mono">{kpis.attendanceToday}</div>
                <div className="text-[11px] text-slate-400 mt-1">Attendance on track</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Pending Leaves</span>
                <div className="text-2xl font-black text-white mt-1 font-mono">{kpis.pendingLeaves}</div>
                <div className="text-[11px] text-amber-400 mt-1">Requires manager review</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Calendar size={20} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Open Positions</span>
                <div className="text-2xl font-black text-white mt-1 font-mono">{kpis.openPositionsCount}</div>
                <div className="text-[11px] text-purple-400 mt-1">{candidates.length} Active Candidates</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <Briefcase size={20} />
              </div>
            </div>
          </div>

          {/* Department Breakdown & Quick Org Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-white">Department Headcount & Allocation</h3>
              <div className="space-y-3">
                {departments.map((d) => {
                  const deptEmps = employees.filter((e) => e.department === d.name);
                  return (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{d.name}</div>
                        <div className="text-slate-400 text-[11px]">Head of Dept: {d.headName}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-blue-400 text-sm">
                          {deptEmps.length} Members
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Budget: {formatCurrency(d.budget)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Leave Approvals */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Pending Leave Requests</h3>
                <button
                  type="button"
                  onClick={() => navigateTo("hrm", "leave")}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Manage All
                </button>
              </div>

              <div className="space-y-3">
                {leaves
                  .filter((l) => l.status === "Pending")
                  .map((lv) => (
                    <div
                      key={lv.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{lv.employeeName}</span>
                        <span className="font-mono text-amber-400 font-semibold">
                          {lv.days} Days ({lv.type})
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{lv.reason}</p>
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {lv.startDate} to {lv.endDate}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateLeaveStatus(lv.id, "Approved")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-[10px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLeaveStatus(lv.id, "Rejected")}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-[10px] font-semibold transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: EMPLOYEES DIRECTORY */}
      {activeSubView === "employees" && (
        <DataTable
          data={filteredEmployees}
          columns={employeeColumns}
          searchPlaceholder="Search employees by name, designation, email..."
          searchField={(e) => `${e.fullName} ${e.designation} ${e.email} ${e.department}`}
          filterComponent={
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          }
        />
      )}

      {/* VIEW: ATTENDANCE */}
      {activeSubView === "attendance" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-white">Today's Quick Clock-In</span>
              <p className="text-slate-400 text-[11px]">Logged in as {currentUser.name} ({currentUser.role})</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={checkInCurrentUser}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm"
              >
                Punch In (Office)
              </button>
              <button
                type="button"
                onClick={checkOutCurrentUser}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Punch Out
              </button>
            </div>
          </div>

          <DataTable
            data={attendance}
            columns={attendanceColumns}
            searchPlaceholder="Search attendance by employee name..."
            searchField={(a) => a.employeeName || ""}
          />
        </div>
      )}

      {/* VIEW: LEAVE MANAGEMENT */}
      {activeSubView === "leave" && (
        <div className="space-y-4">
          {(leaves || []).length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
              No leave requests submitted yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(leaves || []).map((lv) => (
              <div
                key={lv.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{lv.employeeName}</h4>
                    <span className="text-[11px] text-slate-400">
                      {lv.type} Leave • {lv.days} Working Days
                    </span>
                  </div>
                  <StatusBadge status={lv.status} size="sm" />
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-slate-300">
                  <span className="font-semibold text-slate-400 block text-[10px] uppercase mb-0.5">
                    Reason
                  </span>
                  {lv.reason}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>
                    {lv.startDate} to {lv.endDate}
                  </span>
                  {lv.status === "Pending" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateLeaveStatus(lv.id, "Approved")}
                        className="px-3 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateLeaveStatus(lv.id, "Rejected")}
                        className="px-3 py-1 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-xs font-semibold transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: RECRUITMENT ATS */}
      {activeSubView === "recruitment" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Active Open Positions ({positions.length})</h3>
              <p className="text-xs text-slate-400">Job requisitions and candidate pipeline</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddCandidateOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus size={14} />
              <span>Add Candidate</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {positions.map((pos) => {
              const posCandidates = candidates.filter(
                (c: any) => c.positionId === pos.id || c.jobPositionId === pos.id
              );

              const nextStages: Record<string, Candidate["stage"]> = {
                Applied: "Screening",
                Screening: "Interview",
                Interview: "Technical",
                Technical: "Managerial",
                Managerial: "Offer",
                Offer: "Joined",
              };

              const salaryDisplay =
                typeof pos.salaryRange === "string"
                  ? pos.salaryRange
                  : "₹15,00,000 - ₹25,00,000";

              return (
                <div
                  key={pos.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base">{pos.title}</h4>
                      <div className="text-[11px] text-slate-400">
                        {pos.department} • {pos.location} • {pos.openings} Openings
                      </div>
                    </div>
                    <StatusBadge status={pos.status} size="sm" />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 font-mono text-slate-300 flex items-center justify-between">
                    <span>Budgeted CTC:</span>
                    <strong className="text-emerald-400">{salaryDisplay}</strong>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-400 text-[10px] uppercase">
                        Candidates in Pipeline ({posCandidates.length})
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {posCandidates.length === 0 ? (
                        <div className="text-slate-500 text-[11px] py-2">No active candidates in pipeline.</div>
                      ) : (
                        posCandidates.map((cand) => (
                          <div
                            key={cand.id}
                            className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/50 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate">{cand.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                {cand.email} • {cand.experienceYears}y exp
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-mono text-amber-400 font-bold flex items-center gap-0.5">
                                <Star size={11} className="fill-amber-400 text-amber-400" />
                                <span>{cand.rating}</span>
                              </span>
                              <StatusBadge status={cand.stage} size="sm" />
                              {nextStages[cand.stage] && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateCandidate(cand.id, { stage: nextStages[cand.stage] })
                                  }
                                  className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  title={`Advance to ${nextStages[cand.stage]}`}
                                >
                                  <span>Advance</span>
                                  <ArrowRight size={10} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteCandidate(cand.id)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Remove candidate"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: EMPLOYEE SELF SERVICE */}
      {activeSubView === "self-service" && (
        <div className="max-w-3xl space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md space-y-6">
            <div className="flex items-center gap-4">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/40"
              />
              <div>
                <h3 className="text-lg font-bold text-white">{currentUser.name}</h3>
                <p className="text-xs text-slate-400">
                  {currentUser.role} • {currentUser.department}
                </p>
                <div className="mt-1 text-[11px] font-mono text-blue-400">
                  Employee ID: WQ-1001 • {currentUser.email}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                <span className="text-slate-400 text-[11px]">Available Leave Balance</span>
                <div className="text-xl font-bold font-mono text-white mt-1">18 Days</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                <span className="text-slate-400 text-[11px]">This Week Hours Logged</span>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">38.5 / 40h</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                <span className="text-slate-400 text-[11px]">Next Salary Disbursement</span>
                <div className="text-xl font-bold font-mono text-blue-400 mt-1">30 Sep 2026</div>
              </div>
            </div>

            {/* Quick Actions in Self Service */}
            <div className="pt-4 border-t border-slate-800 flex items-center flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openCreateModal("leave")}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Calendar size={14} />
                <span>Apply for Leave</span>
              </button>
              <button
                type="button"
                onClick={() => openCreateModal("expense")}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 cursor-pointer"
              >
                <DollarSign size={14} />
                <span>Claim Reimbursement</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentEmp =
                    employees.find((e) => e.email === currentUser.email) ||
                    employees[0] || {
                      fullName: currentUser.name,
                      employeeNumber: "WQ-1001",
                      designation: currentUser.jobTitle || currentUser.role,
                      department: currentUser.department,
                      salaryBasic: 125000,
                      bankAccountMasked: "HDFC **** 8841",
                      workMode: "On-site" as const,
                      location: "Bengaluru",
                    };
                  generatePayslipPDF(currentEmp as Employee, "August 2026");
                }}
                className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-blue-500/30 transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>Download Official August Payslip (PDF)</span>
              </button>
            </div>
          </div>

          {/* Today's Live Attendance & Clock In / Out */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Daily Attendance & Work Mode</h4>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Standard shift: 09:30 AM – 06:30 PM IST • Bangalore Development Centre
              </p>
            </div>
            <div className="flex items-center gap-3">
              {attendance.some((a) => (a.employeeName === currentUser.name || a.employeeId === currentUser.id) && a.status === "Present") ? (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>Clocked In Today (09:15 AM)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={checkInCurrentUser}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Clock size={14} />
                  <span>Clock In Now</span>
                </button>
              )}
            </div>
          </div>

          {/* My Leave Requests & History */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">My Submitted Leave Applications</h4>
              <button
                type="button"
                onClick={() => openCreateModal("leave")}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                + New Application
              </button>
            </div>

            {leaves.filter((l) => l.employeeName === currentUser.name || l.employeeId === currentUser.id).length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No leave applications recorded for this cycle.</p>
            ) : (
              <div className="space-y-2">
                {leaves
                  .filter((l) => l.employeeName === currentUser.name || l.employeeId === currentUser.id)
                  .map((lv) => (
                    <div
                      key={lv.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{lv.type} Leave ({lv.days} Days)</span>
                        <div className="text-[11px] text-slate-400 mt-0.5">{lv.reason}</div>
                        <div className="text-[10px] font-mono text-slate-500">{lv.startDate} to {lv.endDate}</div>
                      </div>
                      <StatusBadge status={lv.status} size="sm" />
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* My Allocated Hardware & Software Assets */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3">
            <h4 className="text-sm font-bold text-white">My Assigned Hardware & Software Assets</h4>
            {assets.filter((a) => a.assignedToName === currentUser.name).length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">Apple MacBook Pro 16" M3 Max</span>
                  <div className="text-[11px] text-slate-400">IT Serial: WQ-AST-9021 • Warranty Active</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Allocated
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {assets
                  .filter((a) => a.assignedToName === currentUser.name)
                  .map((ast) => (
                    <div
                      key={ast.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{ast.name}</span>
                        <div className="text-[11px] text-slate-400 font-mono">{ast.model || ast.category} • S/N: {ast.serialNumber}</div>
                      </div>
                      <StatusBadge status={ast.status} size="sm" />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: EXPENSES */}
      {activeSubView === "expenses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Expense Reimbursements & Claims</h3>
              <p className="text-xs text-slate-400">Review employee travel, food, and software expenditures</p>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal("expense")}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
            >
              + Submit Claim
            </button>
          </div>

          {(expenses || []).length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
              No expense claims submitted yet. Click "+ Submit Claim" above to file an expense.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(expenses || []).map((exp) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{exp.employeeName}</span>
                    <StatusBadge status={exp.status} size="sm" />
                  </div>
                  <div className="text-slate-300">{exp.description}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 font-mono">
                    <span className="text-slate-500">{exp.category} • {exp.date}</span>
                    <strong className="text-emerald-400 text-sm">{formatCurrency(exp.amount, settings?.currency || "INR", settings?.currencySymbol || "₹")}</strong>
                  </div>

                  {exp.status === "Pending" && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/40">
                      <button
                        type="button"
                        onClick={() => updateExpenseStatus(exp.id, "Approved")}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={11} />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateExpenseStatus(exp.id, "Rejected")}
                        className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: ASSETS */}
      {activeSubView === "assets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Company IT & Hardware Assets</h3>
              <p className="text-xs text-slate-400">Laptops, monitors, security keys assigned to workforce</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddAssetOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus size={14} />
              <span>Register Asset</span>
            </button>
          </div>

          {(assets || []).length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
              No hardware assets registered yet. Click "Register Asset" above to record company equipment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(assets || []).map((ast) => (
                <div
                  key={ast.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-400">
                      {ast.assetCode || `AST-${ast.id.slice(-4)}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={ast.status} size="sm" />
                      <button
                        type="button"
                        onClick={() => setEditingAsset(ast)}
                        className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit asset"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAsset(ast.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-white">{ast.name}</h4>
                  <div className="text-slate-400 text-[11px] font-mono">
                    Assigned to:{" "}
                    <span className="text-slate-200 font-semibold">
                      {ast.assignedToName || ast.employeeName || "Unassigned"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono pt-1 flex items-center justify-between">
                    <span>Serial: {ast.serialNumber}</span>
                    <span className="text-slate-400">Cond: {ast.condition}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          isOpen={true}
          onClose={() => setEditingEmployee(null)}
          onSave={(updated) => {
            updateEmployee(editingEmployee.id, updated);
            setEditingEmployee(null);
          }}
        />
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <EditAssetModal
          asset={editingAsset}
          employees={employees}
          isOpen={true}
          onClose={() => setEditingAsset(null)}
          onSave={(updated) => {
            updateAsset(editingAsset.id, updated);
            setEditingAsset(null);
          }}
        />
      )}

      {/* Add Asset Modal */}
      {isAddAssetOpen && (
        <AddAssetModal
          employees={employees}
          isOpen={true}
          onClose={() => setIsAddAssetOpen(false)}
          onSave={(data) => {
            createAsset(data);
            setIsAddAssetOpen(false);
          }}
        />
      )}

      {/* Add Candidate Modal */}
      {isAddCandidateOpen && (
        <AddCandidateModal
          positions={positions}
          isOpen={true}
          onClose={() => setIsAddCandidateOpen(false)}
          onSave={(data) => {
            createCandidate(data);
            setIsAddCandidateOpen(false);
          }}
        />
      )}
    </div>
  );
};
