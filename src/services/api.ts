import { AuthService } from "./auth";
import {
  Deal,
  Lead,
  Project,
  Milestone,
  Task,
  TaskComment,
  Employee,
  Expense,
  Asset,
  JobPosition,
  Candidate,
  UserInvitation,
  AuditLogItem,
  User,
} from "../types";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; [key: string]: any }> {
  try {
    const token = AuthService.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await res.json()
      : { success: res.ok, error: await res.text() };

    if (res.status === 401) {
      AuthService.clearSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("worqester:session-expired"));
      }
    }

    if (!res.ok) {
      return { success: false, error: data.error || `HTTP error ${res.status}` };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || "Network request failed" };
  }
}

export const CrmApi = {
  getDeals: async (): Promise<Deal[]> => {
    const res = await apiRequest<{ success: boolean; deals: Deal[] }>("/api/crm/deals");
    return res && res.success && res.deals ? res.deals : [];
  },

  createDeal: async (deal: Partial<Deal>): Promise<Deal | null> => {
    const res = await apiRequest<{ success: boolean; deal: Deal }>("/api/crm/deals", {
      method: "POST",
      body: JSON.stringify(deal),
    });
    return res && res.success ? res.deal : null;
  },

  updateDeal: async (id: string, deal: Partial<Deal>): Promise<Deal | null> => {
    const res = await apiRequest<{ success: boolean; deal: Deal }>(`/api/crm/deals/${id}`, {
      method: "PUT",
      body: JSON.stringify(deal),
    });
    return res && res.success ? res.deal : null;
  },

  deleteDeal: async (id: string): Promise<boolean> => {
    const res = await apiRequest(`/api/crm/deals/${id}`, { method: "DELETE" });
    return Boolean(res && res.success);
  },

  getLeads: async (): Promise<Lead[]> => {
    const res = await apiRequest<{ success: boolean; leads: Lead[] }>("/api/crm/leads");
    return res && res.success && res.leads ? res.leads : [];
  },

  createLead: async (lead: Partial<Lead>): Promise<Lead | null> => {
    const res = await apiRequest<{ success: boolean; lead: Lead }>("/api/crm/leads", {
      method: "POST",
      body: JSON.stringify(lead),
    });
    return res && res.success ? res.lead : null;
  },

  updateLead: async (id: string, lead: Partial<Lead>): Promise<Lead | null> => {
    const res = await apiRequest<{ success: boolean; lead: Lead }>(`/api/crm/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(lead),
    });
    return res && res.success ? res.lead : null;
  },

  deleteLead: async (id: string): Promise<boolean> => {
    const res = await apiRequest(`/api/crm/leads/${id}`, { method: "DELETE" });
    return Boolean(res && res.success);
  },
};

export const ProjectsApi = {
  getProjects: async (): Promise<Project[]> => {
    const res = await apiRequest<{ success: boolean; projects: Project[] }>("/api/projects");
    return res && res.success && res.projects ? res.projects : [];
  },

  createProject: async (project: Partial<Project>): Promise<Project | null> => {
    const res = await apiRequest<{ success: boolean; project: Project }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(project),
    });
    return res && res.success ? res.project : null;
  },

  updateProject: async (id: string, project: Partial<Project>): Promise<Project | null> => {
    const res = await apiRequest<{ success: boolean; project: Project }>(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(project),
    });
    return res && res.success ? res.project : null;
  },

  deleteProject: async (id: string): Promise<boolean> => {
    const res = await apiRequest(`/api/projects/${id}`, { method: "DELETE" });
    return Boolean(res && res.success);
  },

  getMilestones: async (): Promise<Milestone[]> => {
    const res = await apiRequest<{ success: boolean; milestones: Milestone[] }>("/api/milestones");
    return res && res.success && res.milestones ? res.milestones : [];
  },

  createMilestone: async (milestone: Partial<Milestone>): Promise<Milestone | null> => {
    const res = await apiRequest<{ success: boolean; milestone: Milestone }>("/api/milestones", {
      method: "POST",
      body: JSON.stringify(milestone),
    });
    return res && res.success ? res.milestone : null;
  },

  updateMilestone: async (id: string, milestone: Partial<Milestone>): Promise<Milestone | null> => {
    const res = await apiRequest<{ success: boolean; milestone: Milestone }>(`/api/milestones/${id}`, {
      method: "PUT",
      body: JSON.stringify(milestone),
    });
    return res && res.success ? res.milestone : null;
  },

  deleteMilestone: async (id: string): Promise<boolean> => {
    const res = await apiRequest(`/api/milestones/${id}`, { method: "DELETE" });
    return Boolean(res && res.success);
  },
};

export const TasksApi = {
  getTasks: async (): Promise<Task[]> => {
    const res = await apiRequest<{ success: boolean; tasks: Task[] }>("/api/tasks");
    return res && res.success && res.tasks ? res.tasks : [];
  },

  createTask: async (task: Partial<Task>): Promise<Task | null> => {
    const res = await apiRequest<{ success: boolean; task: Task }>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
    return res && res.success ? res.task : null;
  },

  updateTask: async (id: string, task: Partial<Task>): Promise<Task | null> => {
    const res = await apiRequest<{ success: boolean; task: Task }>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(task),
    });
    return res && res.success ? res.task : null;
  },

  addTaskComment: async (taskId: string, content: string): Promise<TaskComment | null> => {
    const res = await apiRequest<{ success: boolean; comment: TaskComment }>(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    return res && res.success ? res.comment : null;
  },

  deleteTask: async (id: string): Promise<boolean> => {
    const res = await apiRequest(`/api/tasks/${id}`, { method: "DELETE" });
    return Boolean(res && res.success);
  },
};

export const HrmApi = {
  getEmployees: async (): Promise<Employee[]> => {
    const res = await apiRequest<{ success: boolean; employees: Employee[] }>("/api/hrm/employees");
    return res && res.success && res.employees ? res.employees : [];
  },

  updateEmployee: async (id: string, employee: Partial<Employee>): Promise<Employee | null> => {
    const res = await apiRequest<{ success: boolean; employee: Employee }>(`/api/hrm/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(employee),
    });
    return res && res.success ? res.employee : null;
  },

  getExpenses: async (): Promise<Expense[]> => {
    const res = await apiRequest<{ success: boolean; expenses: Expense[] }>("/api/hrm/expenses");
    return res && res.success && res.expenses ? res.expenses : [];
  },

  createExpense: async (expense: Partial<Expense>): Promise<Expense | null> => {
    const res = await apiRequest<{ success: boolean; expense: Expense }>("/api/hrm/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    });
    return res && res.success ? res.expense : null;
  },

  updateExpenseStatus: async (
    id: string,
    status: "Pending" | "Approved" | "Rejected" | "Reimbursed"
  ): Promise<boolean> => {
    const res = await apiRequest(`/api/hrm/expenses/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return Boolean(res && res.success);
  },

  getAssets: async (): Promise<Asset[]> => {
    const res = await apiRequest<{ success: boolean; assets: Asset[] }>("/api/hrm/assets");
    return res && res.success && res.assets ? res.assets : [];
  },

  createAsset: async (asset: Partial<Asset>): Promise<Asset | null> => {
    const res = await apiRequest<{ success: boolean; asset: Asset }>("/api/hrm/assets", {
      method: "POST",
      body: JSON.stringify(asset),
    });
    return res && res.success ? res.asset : null;
  },

  deleteAsset: async (id: string): Promise<boolean> => {
    const res = await apiRequest(`/api/hrm/assets/${id}`, { method: "DELETE" });
    return Boolean(res && res.success);
  },

  getPositions: async (): Promise<JobPosition[]> => {
    const res = await apiRequest<{ success: boolean; positions: JobPosition[] }>("/api/hrm/positions");
    return res && res.success && res.positions ? res.positions : [];
  },

  getCandidates: async (): Promise<Candidate[]> => {
    const res = await apiRequest<{ success: boolean; candidates: Candidate[] }>("/api/hrm/candidates");
    return res && res.success && res.candidates ? res.candidates : [];
  },

  createCandidate: async (candidate: Partial<Candidate>): Promise<Candidate | null> => {
    const res = await apiRequest<{ success: boolean; candidate: Candidate }>("/api/hrm/candidates", {
      method: "POST",
      body: JSON.stringify(candidate),
    });
    return res && res.success ? res.candidate : null;
  },

  updateCandidateStage: async (id: string, stage: string): Promise<boolean> => {
    const res = await apiRequest(`/api/hrm/candidates/${id}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    });
    return Boolean(res && res.success);
  },

  deleteCandidate: async (id: string): Promise<boolean> => {
    const res = await apiRequest(`/api/hrm/candidates/${id}`, { method: "DELETE" });
    return Boolean(res && res.success);
  },
};

export const SettingsApi = {
  getUsers: async (): Promise<User[]> => {
    const res = await apiRequest<{ success: boolean; users: User[] }>("/api/auth/users");
    return res && res.success && res.users ? res.users : [];
  },

  getInvitations: async (): Promise<UserInvitation[]> => {
    const res = await apiRequest<{ success: boolean; invitations: UserInvitation[] }>("/api/settings/invitations");
    return res && res.success && res.invitations ? res.invitations : [];
  },

  createInvitation: async (invitation: Partial<UserInvitation>): Promise<UserInvitation | null> => {
    const res = await apiRequest<{ success: boolean; invitation: UserInvitation }>("/api/settings/invitations", {
      method: "POST",
      body: JSON.stringify(invitation),
    });
    return res && res.success ? res.invitation : null;
  },

  deleteInvitation: async (id: string): Promise<boolean> => {
    const res = await apiRequest(`/api/settings/invitations/${id}`, { method: "DELETE" });
    return Boolean(res && res.success);
  },

  getRbac: async (): Promise<Record<string, boolean[]>> => {
    const res = await apiRequest<{ success: boolean; matrix: Record<string, boolean[]> }>("/api/settings/rbac");
    return res && res.success && res.matrix ? res.matrix : {};
  },

  updateRbac: async (capability: string, permissions: boolean[]): Promise<boolean> => {
    const res = await apiRequest("/api/settings/rbac", {
      method: "PUT",
      body: JSON.stringify({ capability, permissions }),
    });
    return Boolean(res && res.success);
  },

  getAuditLogs: async (): Promise<AuditLogItem[]> => {
    const res = await apiRequest<{ success: boolean; auditLogs: AuditLogItem[] }>("/api/settings/audit-logs");
    return res && res.success && res.auditLogs ? res.auditLogs : [];
  },

  createAuditLog: async (log: Partial<AuditLogItem>): Promise<boolean> => {
    const res = await apiRequest("/api/settings/audit-logs", {
      method: "POST",
      body: JSON.stringify(log),
    });
    return Boolean(res && res.success);
  },
};

export const HealthApi = {
  getHealth: async (): Promise<any> => {
    const res = await apiRequest("/api/health");
    return res;
  },
};
