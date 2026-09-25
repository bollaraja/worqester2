import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  SystemSettings,
  Company,
  Contact,
  Lead,
  Deal,
  Project,
  Task,
  TaskComment,
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
  Milestone,
  UserInvitation,
  UserRole,
} from "../types";
import { StorageService } from "../services/storage";
import { AuthService } from "../services/auth";
import { CrmApi, ProjectsApi, TasksApi, HrmApi, SettingsApi } from "../services/api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "task" | "deal" | "leave" | "system" | "security";
  link?: { view: string; subView?: string; id?: string };
}

interface AppContextType {
  currentUser: User;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    role?: any;
    department?: string;
    company_name?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  availableUsers: User[];
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  
  // Navigation
  currentView: string;
  currentSubView: string;
  selectedEntityId: string | null;
  navigateTo: (view: string, subView?: string, entityId?: string | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Modals & Panels
  isCreateModalOpen: boolean;
  createModalType: string;
  openCreateModal: (type?: string, prefill?: any) => void;
  closeCreateModal: () => void;
  modalPrefill: any;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  isAiAuditOpen: boolean;
  setIsAiAuditOpen: (open: boolean) => void;
  
  // Search
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
  
  // Notifications
  notifications: Notification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Data Records
  companies: Company[];
  contacts: Contact[];
  leads: Lead[];
  deals: Deal[];
  projects: Project[];
  tasks: Task[];
  departments: Department[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  positions: JobPosition[];
  candidates: Candidate[];
  expenses: Expense[];
  assets: Asset[];
  documents: DocumentItem[];
  notes: NoteItem[];
  activities: ActivityItem[];
  auditLogs: AuditLogItem[];
  automations: AutomationRule[];
  milestones: Milestone[];
  invitations: UserInvitation[];
  rbacPermissions: Record<string, boolean[]>;
  favorites: string[];
  toggleFavorite: (id: string) => void;

  // CRUD Actions
  createLead: (data: Omit<Lead, "id" | "createdAt" | "organizationId">) => void;
  updateLead: (id: string, data: Partial<Lead>) => void;
  createDeal: (data: Omit<Deal, "id" | "createdAt" | "updatedAt" | "organizationId">) => void;
  updateDeal: (id: string, data: Partial<Deal>) => void;
  createProject: (data: Omit<Project, "id" | "createdAt" | "organizationId">) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  createTask: (data: Omit<Task, "id" | "createdAt" | "organizationId">) => Task;
  updateTask: (id: string, data: Partial<Task>) => void;
  addTaskComment: (taskId: string, content: string) => Promise<void>;
  updateTaskNotes: (taskId: string, notes: string) => void;
  toggleTaskCompletion: (id: string) => void;
  setTaskDueDate: (id: string, dueDate: string) => void;
  createCompany: (data: Omit<Company, "id" | "createdAt" | "updatedAt" | "organizationId">) => void;
  updateCompany: (id: string, data: Partial<Company>) => void;
  createContact: (data: Omit<Contact, "id" | "createdAt" | "organizationId">) => void;
  updateContact: (id: string, data: Partial<Contact>) => void;
  createEmployee: (data: Omit<Employee, "id" | "organizationId">) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  createLeaveRequest: (data: Omit<LeaveRequest, "id" | "createdAt">) => void;
  updateLeaveStatus: (id: string, status: "Approved" | "Rejected") => void;
  createExpense: (data: Omit<Expense, "id">) => void;
  updateExpenseStatus: (id: string, status: "Pending" | "Approved" | "Rejected" | "Reimbursed") => void;
  createAsset: (data: Omit<Asset, "id">) => void;
  updateAsset: (id: string, data: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  createCandidate: (data: Omit<Candidate, "id" | "appliedDate">) => void;
  updateCandidate: (id: string, data: Partial<Candidate>) => void;
  deleteCandidate: (id: string) => void;
  createMilestone: (data: Omit<Milestone, "id">) => void;
  updateMilestone: (id: string, data: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  inviteUser: (data: { name: string; email: string; role: UserRole; department: string }) => void;
  revokeInvitation: (id: string) => void;
  toggleRbacPermission: (capability: string, roleIndex: number) => void;
  createNote: (data: Omit<NoteItem, "id" | "updatedAt">) => void;
  updateNote: (id: string, data: Partial<NoteItem>) => void;
  addDocument: (doc: Omit<DocumentItem, "id" | "uploadedAt">) => void;
  updateDocument: (id: string, data: Partial<DocumentItem>) => void;
  deleteItem: (type: string, id: string) => void;
  
  // Attendance actions
  checkInCurrentUser: () => void;
  checkOutCurrentUser: () => void;
  
  // Reset
  resetDemoData: () => void;
  resetToDemoData: () => void;
  refreshData: () => void;
  kpis: ReturnType<typeof StorageService.getDynamicKpis>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialNotifications: Notification[] = [
  {
    id: "notif-1",
    title: "Critical Task Overdue",
    message: "Auth Token Rotation & Session Migration has breached SLA.",
    time: "10 mins ago",
    read: false,
    type: "task",
    link: { view: "tasks", id: "task-101" },
  },
  {
    id: "notif-2",
    title: "Pending Leave Approval",
    message: "Vikram Patel applied for 4 days Annual Leave.",
    time: "1 hour ago",
    read: false,
    type: "leave",
    link: { view: "hrm", subView: "leave" },
  },
  {
    id: "notif-3",
    title: "Deal Probability Alert",
    message: "Acme Global Cloud Portal Migration reached 85% probability.",
    time: "3 hours ago",
    read: false,
    type: "deal",
    link: { view: "crm", subView: "deals" },
  },
  {
    id: "notif-4",
    title: "SOC2 Compliance Scan",
    message: "Weekly automated security baseline verification completed.",
    time: "1 day ago",
    read: true,
    type: "security",
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    return AuthService.getStoredUser() || StorageService.getCurrentUser();
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return AuthService.isAuthenticated();
  });
  const [availableUsers, setAvailableUsers] = useState<User[]>(StorageService.getUsers());
  const [settings, setSettings] = useState<SystemSettings>(StorageService.getSettings());
  
  const [currentView, setCurrentView] = useState("dashboard");
  const [currentSubView, setCurrentSubView] = useState("overview");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState("task");
  const [modalPrefill, setModalPrefill] = useState<any>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isAiAuditOpen, setIsAiAuditOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const syncFromBackend = async () => {
    try {
      const [
        dealsRes,
        leadsRes,
        projectsRes,
        milestonesRes,
        tasksRes,
        employeesRes,
        expensesRes,
        assetsRes,
        candidatesRes,
        invitationsRes,
        rbacRes,
        auditRes,
      ] = await Promise.allSettled([
        CrmApi.getDeals(),
        CrmApi.getLeads(),
        ProjectsApi.getProjects(),
        ProjectsApi.getMilestones(),
        TasksApi.getTasks(),
        HrmApi.getEmployees(),
        HrmApi.getExpenses(),
        HrmApi.getAssets(),
        HrmApi.getCandidates(),
        SettingsApi.getInvitations(),
        SettingsApi.getRbac(),
        SettingsApi.getAuditLogs(),
      ]);

      if (dealsRes.status === "fulfilled" && Array.isArray(dealsRes.value)) {
        setDeals(dealsRes.value);
        StorageService.saveDeals(dealsRes.value);
      }
      if (leadsRes.status === "fulfilled" && Array.isArray(leadsRes.value)) {
        setLeads(leadsRes.value);
        StorageService.saveLeads(leadsRes.value);
      }
      if (projectsRes.status === "fulfilled" && Array.isArray(projectsRes.value)) {
        setProjects(projectsRes.value);
        StorageService.saveProjects(projectsRes.value);
      }
      if (milestonesRes.status === "fulfilled" && Array.isArray(milestonesRes.value)) {
        setMilestones(milestonesRes.value);
        StorageService.saveMilestones(milestonesRes.value);
      }
      if (tasksRes.status === "fulfilled" && Array.isArray(tasksRes.value)) {
        setTasks(tasksRes.value);
        StorageService.saveTasks(tasksRes.value);
      }
      if (employeesRes.status === "fulfilled" && Array.isArray(employeesRes.value)) {
        setEmployees(employeesRes.value);
        StorageService.saveEmployees(employeesRes.value);
      }
      if (expensesRes.status === "fulfilled" && Array.isArray(expensesRes.value)) {
        setExpenses(expensesRes.value);
        StorageService.saveExpenses(expensesRes.value);
      }
      if (assetsRes.status === "fulfilled" && Array.isArray(assetsRes.value)) {
        setAssets(assetsRes.value);
        StorageService.saveAssets(assetsRes.value);
      }
      if (candidatesRes.status === "fulfilled" && Array.isArray(candidatesRes.value)) {
        setCandidates(candidatesRes.value);
        StorageService.saveCandidates(candidatesRes.value);
      }
      if (invitationsRes.status === "fulfilled" && Array.isArray(invitationsRes.value)) {
        setInvitations(invitationsRes.value);
        StorageService.saveInvitations(invitationsRes.value);
      }
      if (rbacRes.status === "fulfilled" && rbacRes.value && typeof rbacRes.value === "object" && Object.keys(rbacRes.value).length > 0) {
        setRbacPermissions(rbacRes.value);
        StorageService.saveRbacPermissions(rbacRes.value);
      }
      if (auditRes.status === "fulfilled" && Array.isArray(auditRes.value)) {
        setAuditLogs(auditRes.value);
        StorageService.saveAuditLogs(auditRes.value);
      }
    } catch (e) {
      console.warn("syncFromBackend warning:", e);
    }
  };

  // Check auth session and sync backend data on startup.
  // Never keep a stale cached user authenticated after the server rejects the session.
  useEffect(() => {
    const handleSessionExpired = () => {
      setIsAuthenticated(false);
      setCurrentUser(StorageService.getCurrentUser());
    };

    window.addEventListener("worqester:session-expired", handleSessionExpired);

    const verifyAndSync = async () => {
      if (!AuthService.isAuthenticated()) return;

      const verified = await AuthService.verifySession();
      if (!verified) {
        setIsAuthenticated(false);
        return;
      }

      setCurrentUser(verified);
      setIsAuthenticated(true);
      await syncFromBackend();
    };

    verifyAndSync();

    return () => {
      window.removeEventListener("worqester:session-expired", handleSessionExpired);
    };
  }, []);

  // Entities state
  const [companies, setCompanies] = useState<Company[]>(StorageService.getCompanies());
  const [contacts, setContacts] = useState<Contact[]>(StorageService.getContacts());
  const [leads, setLeads] = useState<Lead[]>(StorageService.getLeads());
  const [deals, setDeals] = useState<Deal[]>(StorageService.getDeals());
  const [projects, setProjects] = useState<Project[]>(StorageService.getProjects());
  const [tasks, setTasks] = useState<Task[]>(StorageService.getTasks());
  const [departments, setDepartments] = useState<Department[]>(StorageService.getDepartments());
  const [employees, setEmployees] = useState<Employee[]>(StorageService.getEmployees());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(StorageService.getAttendance());
  const [leaves, setLeaves] = useState<LeaveRequest[]>(StorageService.getLeaves());
  const [positions, setPositions] = useState<JobPosition[]>(StorageService.getJobPositions());
  const [candidates, setCandidates] = useState<Candidate[]>(StorageService.getCandidates());
  const [expenses, setExpenses] = useState<Expense[]>(StorageService.getExpenses());
  const [assets, setAssets] = useState<Asset[]>(StorageService.getAssets());
  const [documents, setDocuments] = useState<DocumentItem[]>(StorageService.getDocuments());
  const [notes, setNotes] = useState<NoteItem[]>(StorageService.getNotes());
  const [activities, setActivities] = useState<ActivityItem[]>(StorageService.getActivities());
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(StorageService.getAuditLogs());
  const [automations, setAutomations] = useState<AutomationRule[]>(StorageService.getAutomations());
  const [milestones, setMilestones] = useState<Milestone[]>(StorageService.getMilestones());
  const [invitations, setInvitations] = useState<UserInvitation[]>(StorageService.getInvitations());
  const [rbacPermissions, setRbacPermissions] = useState<Record<string, boolean[]>>(StorageService.getRbacPermissions());
  const [favorites, setFavorites] = useState<string[]>(StorageService.getFavorites());

  const refreshData = () => {
    setCompanies(StorageService.getCompanies());
    setContacts(StorageService.getContacts());
    setLeads(StorageService.getLeads());
    setDeals(StorageService.getDeals());
    setProjects(StorageService.getProjects());
    setTasks(StorageService.getTasks());
    setEmployees(StorageService.getEmployees());
    setAttendance(StorageService.getAttendance());
    setLeaves(StorageService.getLeaves());
    setExpenses(StorageService.getExpenses());
    setAssets(StorageService.getAssets());
    setCandidates(StorageService.getCandidates());
    setMilestones(StorageService.getMilestones());
    setInvitations(StorageService.getInvitations());
    setRbacPermissions(StorageService.getRbacPermissions());
    setDocuments(StorageService.getDocuments());
    setNotes(StorageService.getNotes());
    setActivities(StorageService.getActivities());
    setAuditLogs(StorageService.getAuditLogs());
    setFavorites(StorageService.getFavorites());
    syncFromBackend();
  };


  const switchUser = (userId: string) => {
    const user = availableUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      StorageService.setCurrentUserId(userId);
      StorageService.addAuditLog({
        userName: user.name,
        userRole: user.role,
        action: "Switched Role/User",
        entityType: "UserSession",
        entityName: user.name,
        details: `Simulating user login as ${user.name} (${user.role}).`,
      });
      refreshData();
    }
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
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
    const currentModules = {
      ...defaultModules,
      ...(settings?.modulesEnabled || {}),
      ...(settings?.enabledModules || {}),
    };
    const nextModules = {
      ...currentModules,
      ...(newSettings.modulesEnabled || {}),
      ...(newSettings.enabledModules || {}),
    };
    const updated: SystemSettings = {
      ...settings,
      ...newSettings,
      enabledModules: nextModules,
      modulesEnabled: nextModules,
    };
    setSettings(updated);
    StorageService.saveSettings(updated);
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Updated Settings",
      entityType: "SystemSettings",
      entityName: "Platform Configuration",
      details: `Updated settings (Theme: ${updated.theme}, Currency: ${updated.currency}).`,
    });
    refreshData();
  };

  const navigateTo = (view: string, subView = "overview", entityId: string | null = null) => {
    setCurrentView(view);
    setCurrentSubView(subView);
    setSelectedEntityId(entityId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const login = async (email: string, password: string) => {
    const res = await AuthService.login(email, password);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      StorageService.setCurrentUserId(res.user.id);
      setAvailableUsers((prev) => {
        if (prev.some((u) => u.id === res.user!.id)) return prev;
        const updated = [res.user!, ...prev];
        StorageService.saveUsers(updated);
        return updated;
      });
      StorageService.addAuditLog({
        userName: res.user.name,
        userRole: res.user.role,
        action: "User Sign In",
        entityType: "AuthSession",
        entityName: res.user.email,
        details: `User signed in successfully.`,
      });
      refreshData();
      await syncFromBackend();
      return { success: true };
    }
    return { success: false, error: res.error || "Invalid credentials." };
  };

  const signup = async (data: {
    name: string;
    email: string;
    password: string;
    role?: any;
    department?: string;
    company_name?: string;
  }) => {
    const res = await AuthService.signup(
      data.name,
      data.email,
      data.password,
      data.role || "Project Manager",
      data.department || "Operations",
      data.company_name
    );
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      StorageService.setCurrentUserId(res.user.id);
      const updated = [res.user, ...availableUsers.filter((u) => u.id !== res.user!.id)];
      setAvailableUsers(updated);
      StorageService.saveUsers(updated);
      StorageService.addAuditLog({
        userName: res.user.name,
        userRole: res.user.role,
        action: "User Sign Up",
        entityType: "AuthSession",
        entityName: res.user.email,
        details: `New user account created with role ${res.user.role}.`,
      });
      refreshData();
      await syncFromBackend();
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to create account." };
  };

  const logout = async () => {
    await AuthService.logout();
    setIsAuthenticated(false);
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "User Sign Out",
      entityType: "AuthSession",
      entityName: currentUser.email,
      details: `User logged out from session.`,
    });
  };

  const openCreateModal = (type = "task", prefill: any = null) => {
    setCreateModalType(type);
    setModalPrefill(prefill);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setModalPrefill(null);
  };

  const toggleFavorite = (id: string) => {
    StorageService.toggleFavorite(id);
    setFavorites(StorageService.getFavorites());
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // CRUD implementations with auto-audit logs & activity tracking
  const createLead = (data: Omit<Lead, "id" | "createdAt" | "organizationId">) => {
    const newLead: Lead = {
      ...data,
      id: `lead-${Date.now()}`,
      organizationId: currentUser.organizationId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const list = [newLead, ...leads];
    StorageService.saveLeads(list);
    setLeads(list);
    CrmApi.createLead(newLead).catch((e) => console.error("API createLead error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Created Lead",
      entityType: "Lead",
      entityName: newLead.name,
      details: `Created new lead for ${newLead.company} (Score: ${newLead.score}).`,
    });
    StorageService.addActivity({
      id: `act-${Date.now()}`,
      type: "Status Change",
      title: "New Lead Generated",
      description: `${newLead.name} from ${newLead.company} added by ${currentUser.name}.`,
      entityType: "Customer",
      entityName: newLead.company,
      userName: currentUser.name,
      timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    refreshData();
  };

  const updateLead = (id: string, data: Partial<Lead>) => {
    const list = leads.map((l) => (l.id === id ? { ...l, ...data } : l));
    StorageService.saveLeads(list);
    setLeads(list);
    CrmApi.updateLead(id, data).catch((e) => console.error("API updateLead error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Updated Lead",
      entityType: "Lead",
      entityName: id,
      details: `Modified lead status or details.`,
    });
    refreshData();
  };

  const createDeal = (data: Omit<Deal, "id" | "createdAt" | "updatedAt" | "organizationId">) => {
    const newDeal: Deal = {
      ...data,
      id: `deal-${Date.now()}`,
      organizationId: currentUser.organizationId,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    const list = [newDeal, ...deals];
    StorageService.saveDeals(list);
    setDeals(list);
    CrmApi.createDeal(newDeal).catch((e) => console.error("API createDeal error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Created Deal",
      entityType: "Deal",
      entityName: newDeal.name,
      details: `Created deal worth ₹${newDeal.amount} in ${newDeal.stage} stage.`,
    });
    refreshData();
  };

  const updateDeal = (id: string, data: Partial<Deal>) => {
    const list = deals.map((d) => (d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString().split("T")[0] } : d));
    StorageService.saveDeals(list);
    setDeals(list);
    CrmApi.updateDeal(id, data).catch((e) => console.error("API updateDeal error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Updated Deal",
      entityType: "Deal",
      entityName: id,
      details: `Updated stage or parameters for deal.`,
    });
    refreshData();
  };

  const syncProjectProgress = (projectId: string, currentTasks: Task[]) => {
    const projTasks = currentTasks.filter((t) => t.projectId === projectId);
    if (projTasks.length === 0) return;
    const completed = projTasks.filter((t) => t.status === "Done").length;
    const newProgress = Math.round((completed / projTasks.length) * 100);
    setProjects((prev) => {
      const nextProjects = prev.map((p) => {
        if (p.id === projectId) {
          const status = newProgress === 100 ? "Completed" : p.status === "Completed" ? "In Progress" : p.status;
          return { ...p, progress: newProgress, status };
        }
        return p;
      });
      StorageService.saveProjects(nextProjects);
      return nextProjects;
    });
  };

  const createProject = (data: Omit<Project, "id" | "createdAt" | "organizationId">): Project => {
    const newProject: Project = {
      ...data,
      id: `proj-${Date.now()}`,
      organizationId: currentUser.organizationId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const list = [newProject, ...projects];
    StorageService.saveProjects(list);
    setProjects(list);
    ProjectsApi.createProject(newProject).catch((e) => console.error("API createProject error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Created Project",
      entityType: "Project",
      entityName: newProject.name,
      details: `Created project with code ${newProject.code} (Budget: ₹${newProject.budget}).`,
    });
    refreshData();
    return newProject;
  };

  const updateProject = (id: string, data: Partial<Project>) => {
    const list = projects.map((p) => (p.id === id ? { ...p, ...data } : p));
    StorageService.saveProjects(list);
    setProjects(list);
    ProjectsApi.updateProject(id, data).catch((e) => console.error("API updateProject error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Updated Project",
      entityType: "Project",
      entityName: id,
      details: `Updated project milestone/status.`,
    });
    refreshData();
  };

  const createTask = (data: Omit<Task, "id" | "createdAt" | "organizationId">): Task => {
    const newTask: Task = {
      ...data,
      id: `task-${Date.now()}`,
      organizationId: currentUser.organizationId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const list = [newTask, ...tasks];
    StorageService.saveTasks(list);
    setTasks(list);
    syncProjectProgress(newTask.projectId, list);
    TasksApi.createTask(newTask).catch((e) => console.error("API createTask error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Created Task",
      entityType: "Task",
      entityName: newTask.title,
      details: `Assigned task to ${newTask.assigneeName} with due date ${newTask.dueDate}.`,
    });
    refreshData();
    return newTask;
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    let affectedProjectId: string | undefined;
    const list = tasks.map((t) => {
      if (t.id === id) {
        affectedProjectId = data.projectId || t.projectId;
        return { ...t, ...data };
      }
      return t;
    });
    StorageService.saveTasks(list);
    setTasks(list);
    if (affectedProjectId) {
      syncProjectProgress(affectedProjectId, list);
    }
    TasksApi.updateTask(id, data).catch((e) => console.error("API updateTask error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Updated Task",
      entityType: "Task",
      entityName: id,
      details: `Task status or priority adjusted.`,
    });
    refreshData();
  };

  const toggleTaskCompletion = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const isNowDone = target.status !== "Done";
    const updatedTask: Task = {
      ...target,
      status: isNowDone ? "Done" : "To Do",
      completedAt: isNowDone ? new Date().toISOString() : undefined,
      actualHours: isNowDone ? (target.actualHours || target.estimatedHours) : target.actualHours,
    };
    const list = tasks.map((t) => (t.id === id ? updatedTask : t));
    StorageService.saveTasks(list);
    setTasks(list);
    syncProjectProgress(target.projectId, list);
    TasksApi.updateTask(id, {
      status: updatedTask.status,
      actualHours: updatedTask.actualHours,
    }).catch((e) => console.error("API toggleTaskCompletion error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: isNowDone ? "Completed Task" : "Reopened Task",
      entityType: "Task",
      entityName: target.title,
      details: isNowDone ? `Marked task '${target.title}' as Done.` : `Reopened task '${target.title}'.`,
    });
    refreshData();
  };


  const setTaskDueDate = (id: string, dueDate: string) => {
    updateTask(id, { dueDate });
  };

  const addTaskComment = async (taskId: string, content: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || !content.trim()) return;
    const newComment: TaskComment = {
      id: `cm-${Date.now().toString(36)}`,
      taskId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    const updatedComments = [...(target.comments || []), newComment];
    const updatedList = tasks.map((t) => (t.id === taskId ? { ...t, comments: updatedComments } : t));
    setTasks(updatedList);
    StorageService.saveTasks(updatedList);
    TasksApi.addTaskComment(taskId, content.trim()).catch((e) => console.error("API addTaskComment error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Added Task Comment",
      entityType: "Task",
      entityName: target.title,
      details: `Added comment to task '${target.title}'.`,
    });
    refreshData();
  };

  const updateTaskNotes = (taskId: string, notes: string) => {
    updateTask(taskId, { notes });
  };

  const createCompany = (data: Omit<Company, "id" | "createdAt" | "updatedAt" | "organizationId">) => {
    const newCompany: Company = {
      ...data,
      id: `comp-${Date.now()}`,
      organizationId: currentUser.organizationId,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    const list = [newCompany, ...companies];
    StorageService.saveCompanies(list);
    setCompanies(list);
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Created Company Account",
      entityType: "Company",
      entityName: newCompany.name,
      details: `Created new enterprise account in ${newCompany.industry}.`,
    });
    refreshData();
  };

  const updateCompany = (id: string, data: Partial<Company>) => {
    const list = companies.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString().split("T")[0] } : c));
    StorageService.saveCompanies(list);
    setCompanies(list);
    refreshData();
  };

  const createContact = (data: Omit<Contact, "id" | "createdAt" | "organizationId">) => {
    const newContact: Contact = {
      ...data,
      id: `cont-${Date.now()}`,
      organizationId: currentUser.organizationId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const list = [newContact, ...contacts];
    StorageService.saveContacts(list);
    setContacts(list);
    refreshData();
  };

  const updateContact = (id: string, data: Partial<Contact>) => {
    const list = contacts.map((c) => (c.id === id ? { ...c, ...data } : c));
    StorageService.saveContacts(list);
    setContacts(list);
    refreshData();
  };

  const createEmployee = (data: Omit<Employee, "id" | "organizationId">) => {
    const newEmp: Employee = {
      ...data,
      id: `emp-${Date.now()}`,
      organizationId: currentUser.organizationId,
    };
    const list = [newEmp, ...employees];
    StorageService.saveEmployees(list);
    setEmployees(list);
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Created Employee Record",
      entityType: "Employee",
      entityName: newEmp.fullName,
      details: `Onboarded employee ${newEmp.employeeNumber} into ${newEmp.department}.`,
    });
    refreshData();
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    const list = employees.map((e) => (e.id === id ? { ...e, ...data } : e));
    StorageService.saveEmployees(list);
    setEmployees(list);
    HrmApi.updateEmployee(id, data).catch((e) => console.error("API updateEmployee error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Updated Employee",
      entityType: "Employee",
      entityName: id,
      details: `Modified employee profile / compensation.`,
    });
    refreshData();
  };

  const createLeaveRequest = (data: Omit<LeaveRequest, "id" | "createdAt">) => {
    const newLeave: LeaveRequest = {
      ...data,
      id: `lv-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const list = [newLeave, ...leaves];
    StorageService.saveLeaves(list);
    setLeaves(list);
    refreshData();
  };

  const updateLeaveStatus = (id: string, status: "Approved" | "Rejected") => {
    const list = leaves.map((l) => (l.id === id ? { ...l, status } : l));
    StorageService.saveLeaves(list);
    setLeaves(list);
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: `${status} Leave Request`,
      entityType: "LeaveRequest",
      entityName: id,
      details: `Status set to ${status}.`,
    });
    refreshData();
  };

  const createExpense = (data: Omit<Expense, "id">) => {
    const newExp: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
    };
    const list = [newExp, ...expenses];
    StorageService.saveExpenses(list);
    setExpenses(list);
    HrmApi.createExpense(newExp).catch((e) => console.error("API createExpense error:", e));
    refreshData();
  };

  const updateExpenseStatus = (id: string, status: "Pending" | "Approved" | "Rejected" | "Reimbursed") => {
    const list = expenses.map((e) => (e.id === id ? { ...e, status } : e));
    StorageService.saveExpenses(list);
    setExpenses(list);
    HrmApi.updateExpenseStatus(id, status).catch((e) => console.error("API updateExpenseStatus error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: `${status} Expense`,
      entityType: "Expense",
      entityName: id,
      details: `Expense claim status updated to ${status}.`,
    });
    refreshData();
  };

  const createAsset = (data: Omit<Asset, "id">) => {
    const newAsset: Asset = {
      ...data,
      id: `ast-${Date.now()}`,
      assetCode: data.assetCode || `AST-${Math.floor(1000 + Math.random() * 9000)}`,
      allocatedDate: data.allocatedDate || new Date().toISOString().split("T")[0],
    };
    const list = [newAsset, ...assets];
    StorageService.saveAssets(list);
    setAssets(list);
    HrmApi.createAsset(newAsset).catch((e) => console.error("API createAsset error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Created Asset",
      entityType: "Asset",
      entityName: newAsset.name,
      details: `Registered hardware asset ${newAsset.name} (${newAsset.serialNumber}).`,
    });
    refreshData();
  };

  const updateAsset = (id: string, data: Partial<Asset>) => {
    const list = assets.map((a) => (a.id === id ? { ...a, ...data } : a));
    StorageService.saveAssets(list);
    setAssets(list);
    refreshData();
  };

  const deleteAsset = (id: string) => {
    const list = assets.filter((a) => a.id !== id);
    StorageService.saveAssets(list);
    setAssets(list);
    HrmApi.deleteAsset(id).catch((e) => console.error("API deleteAsset error:", e));
    refreshData();
  };

  const createCandidate = (data: Omit<Candidate, "id" | "appliedDate">) => {
    const newCand: Candidate = {
      ...data,
      id: `cand-${Date.now()}`,
      appliedDate: new Date().toISOString().split("T")[0],
    };
    const list = [newCand, ...candidates];
    StorageService.saveCandidates(list);
    setCandidates(list);
    HrmApi.createCandidate(newCand).catch((e) => console.error("API createCandidate error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Added Candidate",
      entityType: "Candidate",
      entityName: newCand.name,
      details: `Candidate registered for ${newCand.positionTitle}.`,
    });
    refreshData();
  };

  const updateCandidate = (id: string, data: Partial<Candidate>) => {
    const list = candidates.map((c) => (c.id === id ? { ...c, ...data } : c));
    StorageService.saveCandidates(list);
    setCandidates(list);
    if (data.stage) {
      HrmApi.updateCandidateStage(id, data.stage).catch((e) => console.error("API updateCandidateStage error:", e));
    }
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Updated Candidate",
      entityType: "Candidate",
      entityName: id,
      details: `Candidate stage or score updated.`,
    });
    refreshData();
  };

  const deleteCandidate = (id: string) => {
    const list = candidates.filter((c) => c.id !== id);
    StorageService.saveCandidates(list);
    setCandidates(list);
    HrmApi.deleteCandidate(id).catch((e) => console.error("API deleteCandidate error:", e));
    refreshData();
  };

  const createMilestone = (data: Omit<Milestone, "id">) => {
    const newMilestone: Milestone = {
      ...data,
      id: `mls-${Date.now()}`,
    };
    const list = [...milestones, newMilestone];
    StorageService.saveMilestones(list);
    setMilestones(list);
    ProjectsApi.createMilestone(newMilestone).catch((e) => console.error("API createMilestone error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Created Milestone",
      entityType: "Milestone",
      entityName: newMilestone.name,
      details: `Milestone created for project ${newMilestone.projectName || newMilestone.projectId}.`,
    });
    refreshData();
  };

  const updateMilestone = (id: string, data: Partial<Milestone>) => {
    const list = milestones.map((m) => (m.id === id ? { ...m, ...data } : m));
    StorageService.saveMilestones(list);
    setMilestones(list);
    ProjectsApi.updateMilestone(id, data).catch((e) => console.error("API updateMilestone error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Updated Milestone",
      entityType: "Milestone",
      entityName: id,
      details: `Milestone status or details modified.`,
    });
    refreshData();
  };

  const deleteMilestone = (id: string) => {
    const list = milestones.filter((m) => m.id !== id);
    StorageService.saveMilestones(list);
    setMilestones(list);
    ProjectsApi.deleteMilestone(id).catch((e) => console.error("API deleteMilestone error:", e));
    refreshData();
  };

  const inviteUser = (data: { name: string; email: string; role: UserRole; department: string }) => {
    const newInv: UserInvitation = {
      ...data,
      id: `inv-${Date.now()}`,
      status: "Pending",
      invitedAt: new Date().toISOString().split("T")[0],
    };
    const list = [newInv, ...invitations];
    StorageService.saveInvitations(list);
    setInvitations(list);
    SettingsApi.createInvitation(newInv).catch((e) => console.error("API createInvitation error:", e));
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Invited User",
      entityType: "UserInvitation",
      entityName: newInv.email,
      details: `Sent invitation to ${newInv.name} (${newInv.role}, ${newInv.department}).`,
    });
    refreshData();
  };

  const revokeInvitation = (id: string) => {
    const list = invitations.filter((inv) => inv.id !== id);
    StorageService.saveInvitations(list);
    setInvitations(list);
    SettingsApi.deleteInvitation(id).catch((e) => console.error("API deleteInvitation error:", e));
    refreshData();
  };

  const toggleRbacPermission = (capability: string, roleIndex: number) => {
    const current = rbacPermissions[capability] || [false, false, false, false];
    const updated = [...current];
    updated[roleIndex] = !updated[roleIndex];
    const newMatrix = { ...rbacPermissions, [capability]: updated };
    StorageService.saveRbacPermissions(newMatrix);
    setRbacPermissions(newMatrix);
    SettingsApi.updateRbac(capability, updated).catch((e) => console.error("API updateRbac error:", e));
  };

  const createNote = (data: Omit<NoteItem, "id" | "updatedAt">) => {
    const newNote: NoteItem = {
      ...data,
      id: `note-${Date.now()}`,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    const list = [newNote, ...notes];
    StorageService.saveNotes(list);
    setNotes(list);
    refreshData();
  };

  const updateNote = (id: string, data: Partial<NoteItem>) => {
    const list = notes.map((n) =>
      n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString().split("T")[0] } : n
    );
    StorageService.saveNotes(list);
    setNotes(list);
    refreshData();
  };

  const addDocument = (doc: Omit<DocumentItem, "id" | "uploadedAt">) => {
    const newDoc: DocumentItem = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString().split("T")[0],
    };
    const list = [newDoc, ...documents];
    StorageService.saveDocuments(list);
    setDocuments(list);
    refreshData();
  };

  const updateDocument = (id: string, data: Partial<DocumentItem>) => {
    const list = documents.map((d) => (d.id === id ? { ...d, ...data } : d));
    StorageService.saveDocuments(list);
    setDocuments(list);
    refreshData();
  };

  const deleteItem = (type: string, id: string) => {
    if (type === "lead") {
      const filtered = leads.filter((l) => l.id !== id);
      StorageService.saveLeads(filtered);
      setLeads(filtered);
      CrmApi.deleteLead(id).catch((e) => console.error("API deleteLead error:", e));
    } else if (type === "deal") {
      const filtered = deals.filter((d) => d.id !== id);
      StorageService.saveDeals(filtered);
      setDeals(filtered);
      CrmApi.deleteDeal(id).catch((e) => console.error("API deleteDeal error:", e));
    } else if (type === "project") {
      const filtered = projects.filter((p) => p.id !== id);
      StorageService.saveProjects(filtered);
      setProjects(filtered);
      ProjectsApi.deleteProject(id).catch((e) => console.error("API deleteProject error:", e));
    } else if (type === "task") {
      const filtered = tasks.filter((t) => t.id !== id);
      StorageService.saveTasks(filtered);
      setTasks(filtered);
      TasksApi.deleteTask(id).catch((e) => console.error("API deleteTask error:", e));
    } else if (type === "company") {
      const filtered = companies.filter((c) => c.id !== id);
      StorageService.saveCompanies(filtered);
      setCompanies(filtered);
    } else if (type === "contact") {
      const filtered = contacts.filter((c) => c.id !== id);
      StorageService.saveContacts(filtered);
      setContacts(filtered);
    } else if (type === "employee") {
      const filtered = employees.filter((e) => e.id !== id);
      StorageService.saveEmployees(filtered);
      setEmployees(filtered);
    } else if (type === "document") {
      const filtered = documents.filter((d) => d.id !== id);
      StorageService.saveDocuments(filtered);
      setDocuments(filtered);
    } else if (type === "note") {
      const filtered = notes.filter((n) => n.id !== id);
      StorageService.saveNotes(filtered);
      setNotes(filtered);
    } else if (type === "asset") {
      deleteAsset(id);
    } else if (type === "candidate") {
      deleteCandidate(id);
    } else if (type === "milestone") {
      deleteMilestone(id);
    } else if (type === "expense") {
      const filtered = expenses.filter((e) => e.id !== id);
      StorageService.saveExpenses(filtered);
      setExpenses(filtered);
    }
    StorageService.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Deleted Item",
      entityType: type,
      entityName: id,
      details: `Soft deleted ${type} record ID: ${id}.`,
    });
    refreshData();
  };


  const checkInCurrentUser = () => {
    const record: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      date: new Date().toISOString().split("T")[0],
      checkIn: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      totalHours: 0,
      status: "Present",
      workMode: "Office",
    };
    const list = [record, ...attendance];
    StorageService.saveAttendance(list);
    setAttendance(list);
  };

  const checkOutCurrentUser = () => {
    const list = attendance.map((a) => {
      if (a.employeeName === currentUser.name) {
        return {
          ...a,
          checkOut: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          totalHours: 8.5,
        };
      }
      return a;
    });
    StorageService.saveAttendance(list);
    setAttendance(list);
  };

  const resetDemoData = () => {
    StorageService.resetToDemoData();
    setCompanies(StorageService.getCompanies());
    setContacts(StorageService.getContacts());
    setLeads(StorageService.getLeads());
    setDeals(StorageService.getDeals());
    setProjects(StorageService.getProjects());
    setTasks(StorageService.getTasks());
    setEmployees(StorageService.getEmployees());
    setAttendance(StorageService.getAttendance());
    setLeaves(StorageService.getLeaves());
    setExpenses(StorageService.getExpenses());
    setAssets(StorageService.getAssets());
    setDocuments(StorageService.getDocuments());
    setNotes(StorageService.getNotes());
    setActivities(StorageService.getActivities());
    setAuditLogs(StorageService.getAuditLogs());
    setMilestones(StorageService.getMilestones());
    setInvitations(StorageService.getInvitations());
    setCandidates(StorageService.getCandidates());
    setRbacPermissions(StorageService.getRbacPermissions());
    setSettings(StorageService.getSettings());
    setFavorites(StorageService.getFavorites());
  };

  // Keyboard shortcut Ctrl+K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const kpis = StorageService.getDynamicKpis();

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        signup,
        logout,
        switchUser,
        availableUsers,
        settings,
        updateSettings,
        currentView,
        currentSubView,
        selectedEntityId,
        navigateTo,
        sidebarCollapsed,
        setSidebarCollapsed,
        isCreateModalOpen,
        createModalType,
        openCreateModal,
        closeCreateModal,
        modalPrefill,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isAiAssistantOpen,
        setIsAiAssistantOpen,
        isAiAuditOpen,
        setIsAiAuditOpen,
        globalSearchQuery,
        setGlobalSearchQuery,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        companies,
        contacts,
        leads,
        deals,
        projects,
        tasks,
        departments,
        employees,
        attendance,
        leaves,
        positions,
        candidates,
        expenses,
        assets,
        milestones,
        invitations,
        rbacPermissions,
        documents,
        notes,
        activities,
        auditLogs,
        automations,
        favorites,
        toggleFavorite,
        createLead,
        updateLead,
        createDeal,
        updateDeal,
        createProject,
        updateProject,
        createTask,
        updateTask,
        addTaskComment,
        updateTaskNotes,
        toggleTaskCompletion,
        setTaskDueDate,
        createCompany,
        updateCompany,
        createContact,
        updateContact,
        createEmployee,
        updateEmployee,
        createLeaveRequest,
        updateLeaveStatus,
        createExpense,
        updateExpenseStatus,
        createAsset,
        updateAsset,
        deleteAsset,
        createCandidate,
        updateCandidate,
        deleteCandidate,
        createMilestone,
        updateMilestone,
        deleteMilestone,
        inviteUser,
        revokeInvitation,
        toggleRbacPermission,
        createNote,
        updateNote,
        addDocument,
        updateDocument,
        deleteItem,
        checkInCurrentUser,
        checkOutCurrentUser,
        resetDemoData,
        resetToDemoData: resetDemoData,
        refreshData,
        kpis,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
