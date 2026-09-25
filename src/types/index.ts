export type UserRole =
  | "Super Admin"
  | "Admin"
  | "Management"
  | "HR Admin"
  | "HR Manager"
  | "HR Executive"
  | "Recruiter"
  | "Finance"
  | "Sales Manager"
  | "Sales Executive"
  | "Project Manager"
  | "Team Lead"
  | "Employee"
  | "Viewer";

export type Role = UserRole;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department: string;
  jobTitle: string;
  organizationId: string;
}

export type HealthStatus = "Healthy" | "Watch" | "At Risk" | "Critical";
export type PriorityLevel = "Critical" | "High" | "Medium" | "Low";

export interface Company {
  id: string;
  organizationId?: string;
  name: string;
  industry: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  location?: string;
  country?: string;
  employeesCount?: number;
  annualRevenue?: number;
  revenue?: number;
  ownerId?: string;
  ownerName?: string;
  primaryContact?: string;
  health?: HealthStatus;
  status?: string;
  tier?: string;
  healthReason?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface Contact {
  id: string;
  organizationId: string;
  companyId: string;
  companyName: string;
  name: string;
  designation: string;
  title?: string;
  email: string;
  phone: string;
  location: string;
  avatar?: string;
  decisionMaker?: boolean;
  lastContacted: string;
  nextFollowUp?: string;
  tags: string[];
  createdAt: string;
}

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Unqualified" | "Converted" | "Lost";

export interface Lead {
  id: string;
  organizationId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  source: string;
  ownerId: string;
  ownerName: string;
  status: LeadStatus;
  priority: PriorityLevel;
  score: number;
  expectedValue: number;
  nextFollowUp: string;
  createdAt: string;
}

export type DealStage =
  | "New"
  | "Qualification"
  | "Discovery"
  | "Proposal"
  | "Negotiation"
  | "Closed Won"
  | "Closed Lost";

export interface Deal {
  id: string;
  organizationId: string;
  name: string;
  companyId: string;
  companyName: string;
  contactId: string;
  contactName: string;
  ownerId: string;
  ownerName: string;
  stage: DealStage;
  amount: number;
  probability: number;
  expectedCloseDate: string;
  priority: PriorityLevel;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus =
  | "Planning"
  | "In Progress"
  | "On Hold"
  | "At Risk"
  | "Completed"
  | "Cancelled"
  | (string & {});

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  companyId?: string;
  companyName?: string;
  projectManagerId: string;
  projectManagerName: string;
  teamMemberIds: string[];
  startDate: string;
  endDate: string;
  priority: PriorityLevel;
  status: ProjectStatus;
  health: HealthStatus;
  budget: number;
  spent: number;
  progress: number;
  description: string;
  createdAt: string;
}

export type TaskStatus = "Backlog" | "To Do" | "In Progress" | "Review" | "Blocked" | "Done";

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  projectId: string;
  projectName: string;
  epic?: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar?: string;
  reporterId: string;
  reporterName: string;
  priority: PriorityLevel;
  status: TaskStatus;
  labels: string[];
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  slaBreached?: boolean;
  comments?: TaskComment[];
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export type EmploymentType = "Full Time" | "Part Time" | "Contract" | "Intern";
export type EmploymentStatus = "Active" | "Probation" | "On Leave" | "Notice Period" | "Exited";

export interface Employee {
  id: string;
  organizationId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  department: string;
  team: string;
  designation: string;
  managerId?: string;
  managerName?: string;
  location: string;
  employmentType: EmploymentType;
  joiningDate: string;
  status: EmploymentStatus;
  workMode: "On-site" | "Hybrid" | "Remote";
  skills: string[];
  capacityHoursPerWeek: number;
  loggedHoursThisWeek: number;
  leaveBalanceDays: number;
  salaryBasic: number;
  bankAccountMasked: string;
}

export interface Department {
  id: string;
  name: string;
  headName: string;
  headEmail: string;
  location: string;
  budget: number;
  employeeCount: number;
  description: string;
}

export type AttendanceStatus = "Present" | "Absent" | "Half Day" | "Late" | "On Leave" | "WFH";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  totalHours: number;
  status: AttendanceStatus;
  workMode: string;
}

export type LeaveType = "Casual" | "Sick" | "Annual" | "Maternity" | "Paternity" | "Unpaid";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  approverName: string;
  status: LeaveStatus;
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  positionId: string;
  positionTitle: string;
  stage:
    | "Applied"
    | "Screening"
    | "Interview"
    | "Technical"
    | "Managerial"
    | "HR"
    | "Offer"
    | "Joined"
    | "Rejected";
  experienceYears: number;
  rating: number;
  appliedDate: string;
}

export interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  openings: number;
  hiringManager: string;
  status: "Open" | "Closed" | "Draft";
  salaryRange: string;
  experience: string;
}

export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  category: "Travel" | "Food" | "Office" | "Client Meeting" | "Software" | "Other";
  amount: number;
  date: string;
  description: string;
  projectName?: string;
  status: "Pending" | "Approved" | "Rejected" | "Reimbursed";
}

export interface Asset {
  id: string;
  name: string;
  category: "Laptop" | "Desktop" | "Monitor" | "Mobile" | "Access Card";
  serialNumber: string;
  assetCode?: string;
  model?: string;
  employeeName?: string;
  employeeId?: string;
  assignedToName?: string;
  condition: "New" | "Good" | "Fair" | "Repair";
  status: "Assigned" | "Available" | "Repair" | "Retired";
  allocatedDate?: string;
}


export interface DocumentItem {
  id: string;
  name?: string;
  title?: string;
  category?: "Contracts" | "Proposals" | "Policies" | "Project" | "Employee" | "Invoices" | string;
  size?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  version?: string;
  uploadedBy: string;
  uploadedAt: string;
  expiryDate?: string;
  tags: string[];
  url?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  linkedEntity?: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  type: "Call" | "Meeting" | "Email" | "Task" | "Note" | "Status Change";
  title: string;
  description: string;
  entityType: "Customer" | "Deal" | "Project" | "Task" | "Employee";
  entityName: string;
  userName: string;
  timestamp: string;
}

export interface AuditLogItem {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityName: string;
  details: string;
  timestamp: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  enabled?: boolean;
  category?: string;
  lastTriggered?: string;
  executionCount?: number;
  active?: boolean;
}

export interface SystemSettings {
  companyName: string;
  tagline: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  theme: "dark" | "light";
  enabledModules?: {
    crm: boolean;
    projects: boolean;
    tasks: boolean;
    hrm: boolean;
    recruitment: boolean;
    attendance: boolean;
    expenses: boolean;
    assets: boolean;
    documents: boolean;
    reports: boolean;
    ai: boolean;
    automations: boolean;
  };
  modulesEnabled?: Record<string, boolean>;
}

export interface Milestone {
  id: string;
  projectId: string;
  projectName?: string;
  name: string;
  dueDate: string;
  status: "Completed" | "In Progress" | "Pending Review" | "Planning";
  weight?: string;
  description?: string;
}

export interface UserInvitation {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  department: string;
  status: "Pending" | "Accepted";
  invitedAt?: string;
  invitedBy?: string;
  sentDate?: string;
}
