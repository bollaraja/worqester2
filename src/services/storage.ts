import {
  initialUsers,
  initialSettings,
  initialCompanies,
  initialContacts,
  initialLeads,
  initialDeals,
  initialProjects,
  initialTasks,
  initialDepartments,
  initialEmployees,
  initialAttendance,
  initialLeaveRequests,
  initialJobPositions,
  initialCandidates,
  initialExpenses,
  initialAssets,
  initialDocuments,
  initialNotes,
  initialActivities,
  initialAuditLogs,
  initialAutomations,
  initialMilestones,
  initialInvitations,
} from "./seedData";
import {
  Company,
  Contact,
  Lead,
  Deal,
  Project,
  Task,
  Employee,
  Department,
  AttendanceRecord,
  LeaveRequest,
  JobPosition,
  Candidate,
  Expense,
  Asset,
  DocumentItem,
  NoteItem,
  ActivityItem,
  AuditLogItem,
  AutomationRule,
  SystemSettings,
  User,
  Milestone,
  UserInvitation,
} from "../types";

const STORAGE_KEYS = {
  USERS: "worqester_users_v1",
  CURRENT_USER_ID: "worqester_current_user_v1",
  SETTINGS: "worqester_settings_v1",
  COMPANIES: "worqester_companies_v1",
  CONTACTS: "worqester_contacts_v1",
  LEADS: "worqester_leads_v1",
  DEALS: "worqester_deals_v1",
  PROJECTS: "worqester_projects_v1",
  TASKS: "worqester_tasks_v1",
  DEPARTMENTS: "worqester_departments_v1",
  EMPLOYEES: "worqester_employees_v1",
  ATTENDANCE: "worqester_attendance_v1",
  LEAVES: "worqester_leaves_v1",
  POSITIONS: "worqester_positions_v1",
  CANDIDATES: "worqester_candidates_v1",
  EXPENSES: "worqester_expenses_v1",
  ASSETS: "worqester_assets_v1",
  DOCUMENTS: "worqester_documents_v1",
  NOTES: "worqester_notes_v1",
  ACTIVITIES: "worqester_activities_v1",
  AUDIT_LOGS: "worqester_audit_logs_v1",
  AUTOMATIONS: "worqester_automations_v1",
  FAVORITES: "worqester_favorites_v1",
  MILESTONES: "worqester_milestones_v1",
  INVITATIONS: "worqester_invitations_v1",
  RBAC_PERMISSIONS: "worqester_rbac_permissions_v1",
};

export class StorageService {
  private static load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn(`Failed reading ${key} from storage:`, e);
      return fallback;
    }
  }

  private static save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed saving ${key} to storage:`, e);
    }
  }

  // Getters
  static getUsers(): User[] {
    return this.load(STORAGE_KEYS.USERS, initialUsers);
  }

  static saveUsers(users: User[]): void {
    this.save(STORAGE_KEYS.USERS, users);
  }

  static getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return users.find((u) => u.id === currentId) || users[0];
  }

  static setCurrentUserId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  }

  static getSettings(): SystemSettings {
    const raw: Partial<SystemSettings> = this.load<SystemSettings>(STORAGE_KEYS.SETTINGS, initialSettings) || {};
    const defaultModules = {
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
    };
    const mergedModules = {
      ...defaultModules,
      ...(raw.modulesEnabled || {}),
      ...(raw.enabledModules || {}),
    };
    return {
      companyName: raw.companyName || initialSettings.companyName,
      tagline: raw.tagline || initialSettings.tagline,
      currency: raw.currency || initialSettings.currency,
      currencySymbol: raw.currencySymbol || initialSettings.currencySymbol,
      timezone: raw.timezone || initialSettings.timezone,
      theme: raw.theme || initialSettings.theme,
      enabledModules: mergedModules,
      modulesEnabled: mergedModules,
    };
  }

  static saveSettings(settings: SystemSettings): void {
    const defaultModules = {
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
    };
    const mergedModules = {
      ...defaultModules,
      ...(settings?.modulesEnabled || {}),
      ...(settings?.enabledModules || {}),
    };
    const normalized: SystemSettings = {
      ...settings,
      enabledModules: mergedModules,
      modulesEnabled: mergedModules,
    };
    this.save(STORAGE_KEYS.SETTINGS, normalized);
  }

  static getCompanies(): Company[] {
    return this.load(STORAGE_KEYS.COMPANIES, initialCompanies);
  }

  static saveCompanies(items: Company[]): void {
    this.save(STORAGE_KEYS.COMPANIES, items);
  }

  static getContacts(): Contact[] {
    return this.load(STORAGE_KEYS.CONTACTS, initialContacts);
  }

  static saveContacts(items: Contact[]): void {
    this.save(STORAGE_KEYS.CONTACTS, items);
  }

  static getLeads(): Lead[] {
    return this.load(STORAGE_KEYS.LEADS, initialLeads);
  }

  static saveLeads(items: Lead[]): void {
    this.save(STORAGE_KEYS.LEADS, items);
  }

  static getDeals(): Deal[] {
    return this.load(STORAGE_KEYS.DEALS, initialDeals);
  }

  static saveDeals(items: Deal[]): void {
    this.save(STORAGE_KEYS.DEALS, items);
  }

  static getProjects(): Project[] {
    return this.load(STORAGE_KEYS.PROJECTS, initialProjects);
  }

  static saveProjects(items: Project[]): void {
    this.save(STORAGE_KEYS.PROJECTS, items);
  }

  static getTasks(): Task[] {
    return this.load(STORAGE_KEYS.TASKS, initialTasks);
  }

  static saveTasks(items: Task[]): void {
    this.save(STORAGE_KEYS.TASKS, items);
  }

  static getDepartments(): Department[] {
    return this.load(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
  }

  static getEmployees(): Employee[] {
    return this.load(STORAGE_KEYS.EMPLOYEES, initialEmployees);
  }

  static saveEmployees(items: Employee[]): void {
    this.save(STORAGE_KEYS.EMPLOYEES, items);
  }

  static getAttendance(): AttendanceRecord[] {
    return this.load(STORAGE_KEYS.ATTENDANCE, initialAttendance);
  }

  static saveAttendance(items: AttendanceRecord[]): void {
    this.save(STORAGE_KEYS.ATTENDANCE, items);
  }

  static getLeaves(): LeaveRequest[] {
    return this.load(STORAGE_KEYS.LEAVES, initialLeaveRequests);
  }

  static saveLeaves(items: LeaveRequest[]): void {
    this.save(STORAGE_KEYS.LEAVES, items);
  }

  static getJobPositions(): JobPosition[] {
    return this.load(STORAGE_KEYS.POSITIONS, initialJobPositions);
  }

  static saveJobPositions(items: JobPosition[]): void {
    this.save(STORAGE_KEYS.POSITIONS, items);
  }

  static getCandidates(): Candidate[] {
    return this.load(STORAGE_KEYS.CANDIDATES, initialCandidates);
  }

  static saveCandidates(items: Candidate[]): void {
    this.save(STORAGE_KEYS.CANDIDATES, items);
  }

  static getExpenses(): Expense[] {
    return this.load(STORAGE_KEYS.EXPENSES, initialExpenses);
  }

  static saveExpenses(items: Expense[]): void {
    this.save(STORAGE_KEYS.EXPENSES, items);
  }

  static getAssets(): Asset[] {
    return this.load(STORAGE_KEYS.ASSETS, initialAssets);
  }

  static saveAssets(items: Asset[]): void {
    this.save(STORAGE_KEYS.ASSETS, items);
  }

  static getDocuments(): DocumentItem[] {
    return this.load(STORAGE_KEYS.DOCUMENTS, initialDocuments);
  }

  static saveDocuments(items: DocumentItem[]): void {
    this.save(STORAGE_KEYS.DOCUMENTS, items);
  }

  static getNotes(): NoteItem[] {
    return this.load(STORAGE_KEYS.NOTES, initialNotes);
  }

  static saveNotes(items: NoteItem[]): void {
    this.save(STORAGE_KEYS.NOTES, items);
  }

  static getActivities(): ActivityItem[] {
    return this.load(STORAGE_KEYS.ACTIVITIES, initialActivities);
  }

  static addActivity(item: ActivityItem): void {
    const list = this.getActivities();
    list.unshift(item);
    this.save(STORAGE_KEYS.ACTIVITIES, list);
  }

  static getAuditLogs(): AuditLogItem[] {
    return this.load(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
  }

  static addAuditLog(item: Omit<AuditLogItem, "id" | "timestamp">): void {
    const list = this.getAuditLogs();
    const newLog: AuditLogItem = {
      ...item,
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    };
    list.unshift(newLog);
    this.save(STORAGE_KEYS.AUDIT_LOGS, list.slice(0, 200));
  }

  static saveAuditLogs(items: AuditLogItem[]): void {
    this.save(STORAGE_KEYS.AUDIT_LOGS, items);
  }


  static getAutomations(): AutomationRule[] {
    return this.load(STORAGE_KEYS.AUTOMATIONS, initialAutomations);
  }

  static saveAutomations(items: AutomationRule[]): void {
    this.save(STORAGE_KEYS.AUTOMATIONS, items);
  }

  static getFavorites(): string[] {
    return this.load(STORAGE_KEYS.FAVORITES, ["comp-01", "proj-01", "deal-01"]);
  }

  static toggleFavorite(id: string): void {
    const favs = this.getFavorites();
    const index = favs.indexOf(id);
    if (index > -1) {
      favs.splice(index, 1);
    } else {
      favs.push(id);
    }
    this.save(STORAGE_KEYS.FAVORITES, favs);
  }

  static getMilestones(): Milestone[] {
    return this.load(STORAGE_KEYS.MILESTONES, initialMilestones);
  }

  static saveMilestones(items: Milestone[]): void {
    this.save(STORAGE_KEYS.MILESTONES, items);
  }

  static getInvitations(): UserInvitation[] {
    return this.load(STORAGE_KEYS.INVITATIONS, initialInvitations);
  }

  static saveInvitations(items: UserInvitation[]): void {
    this.save(STORAGE_KEYS.INVITATIONS, items);
  }

  static getRbacPermissions(): Record<string, boolean[]> {
    return this.load(STORAGE_KEYS.RBAC_PERMISSIONS, {
      "View Enterprise Dashboard & KPIs": [true, true, true, true],
      "Create & Edit CRM Deals / Accounts": [true, true, true, false],
      "Manage Employee Profiles & Salaries": [true, false, false, false],
      "Approve / Reject Leave Requests": [true, true, true, false],
      "Manage Project Budgets & Roadmaps": [true, true, true, false],
      "Execute AI Operations Audit": [true, true, true, false],
      "Mark Personal Daily Attendance": [true, true, true, true],
      "Access Organization System Settings": [true, false, false, false],
    });
  }

  static saveRbacPermissions(matrix: Record<string, boolean[]>): void {
    this.save(STORAGE_KEYS.RBAC_PERMISSIONS, matrix);
  }

  // Reset demo data
  static resetToDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.COMPANIES);
    localStorage.removeItem(STORAGE_KEYS.CONTACTS);
    localStorage.removeItem(STORAGE_KEYS.LEADS);
    localStorage.removeItem(STORAGE_KEYS.DEALS);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.DEPARTMENTS);
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.LEAVES);
    localStorage.removeItem(STORAGE_KEYS.POSITIONS);
    localStorage.removeItem(STORAGE_KEYS.CANDIDATES);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.ASSETS);
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.AUTOMATIONS);
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    localStorage.removeItem(STORAGE_KEYS.MILESTONES);
    localStorage.removeItem(STORAGE_KEYS.INVITATIONS);
    localStorage.removeItem(STORAGE_KEYS.RBAC_PERMISSIONS);
  }

  // Dynamic KPI Engine
  static getDynamicKpis() {
    const projects = this.getProjects();
    const tasks = this.getTasks();
    const leads = this.getLeads();
    const deals = this.getDeals();
    const employees = this.getEmployees();
    const attendance = this.getAttendance();
    const positions = this.getJobPositions();
    const leaves = this.getLeaves();

    const activeProjects = projects.filter((p) => p.status === "In Progress" || p.status === "Planning").length;
    const projectsAtRisk = projects.filter((p) => p.health === "At Risk" || p.health === "Critical").length;

    const openTasks = tasks.filter((t) => t.status !== "Done").length;
    const completedTasks = tasks.filter((t) => t.status === "Done").length;
    const overdueTasks = tasks.filter((t) => {
      if (t.status === "Done") return false;
      const due = new Date(t.dueDate);
      const now = new Date();
      return due < now || t.slaBreached;
    }).length;

    const activeLeads = leads.filter((l) => l.status === "New" || l.status === "Contacted" || l.status === "Qualified").length;
    
    const openDeals = deals.filter((d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost");
    const pipelineValue = openDeals.reduce((sum, d) => sum + d.amount, 0);
    const weightedPipeline = openDeals.reduce((sum, d) => sum + (d.amount * d.probability) / 100, 0);
    const wonDeals = deals.filter((d) => d.stage === "Closed Won");
    const wonRevenue = wonDeals.reduce((sum, d) => sum + d.amount, 0);

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.status === "Active").length;
    const attendanceToday = attendance.filter((a) => a.status === "Present").length;
    const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
    const openPositionsCount = positions.filter((p) => p.status === "Open").reduce((s, p) => s + p.openings, 0);

    // Business Health Score (0-100)
    let score = 100;
    if (overdueTasks > 0) score -= overdueTasks * 4;
    if (projectsAtRisk > 0) score -= projectsAtRisk * 8;
    if (pendingLeaves > 3) score -= 3;
    const businessHealthScore = Math.max(40, Math.min(100, score));

    return {
      activeProjects,
      projectsAtRisk,
      openTasks,
      completedTasks,
      overdueTasks,
      activeLeads,
      openDealsCount: openDeals.length,
      pipelineValue,
      weightedPipeline,
      wonRevenue,
      totalEmployees,
      activeEmployees,
      attendanceToday,
      pendingLeaves,
      openPositionsCount,
      businessHealthScore,
      businessHealthStatus: businessHealthScore >= 80 ? "Healthy" : businessHealthScore >= 60 ? "Watch" : "At Risk",
    };
  }
}

