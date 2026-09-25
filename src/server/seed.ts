import { DatabaseAdapter, generateSalt, hashPassword } from "./db";

export async function seedDatabase(db: DatabaseAdapter, isAutoSeed = false): Promise<void> {
  const startTime = Date.now();
  if (!isAutoSeed) {
    console.log("[Seed] Target Database: " + (db.isPostgres() ? "PostgreSQL" : "SQLite"));
  }

  const now = new Date().toISOString();
  const workspaceId = "org-worqester-01";

  // 1. Workspace
  if (!isAutoSeed) console.log("[Seed] Seeding primary tenant workspace...");
  await db.execute(
    "INSERT OR IGNORE INTO workspaces (id, name, slug, plan, created_at) VALUES (?, ?, ?, ?, ?)",
    [workspaceId, "Worqester Technologies", "worqester", "Enterprise Cloud", now]
  );

  // 2. Users (PBKDF2-HMAC-SHA256 with 600k iterations)
  if (!isAutoSeed) console.log("[Seed] Seeding users with 600,000-iteration PBKDF2 hashes...");
  const defaultPassword = "password123";
  const users = [
    {
      id: "usr-01",
      name: "Alex Vance",
      email: "alex.vance@worqester.internal",
      role: "Super Admin",
      department: "Executive",
      job_title: "Chief Executive Officer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr-02",
      name: "Priya Sharma",
      email: "priya.sharma@worqester.internal",
      role: "Executive",
      department: "Operations",
      job_title: "Chief Operating Officer",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr-03",
      name: "Marcus Reed",
      email: "marcus.reed@worqester.internal",
      role: "Project Manager",
      department: "Engineering",
      job_title: "VP of Engineering",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr-04",
      name: "Elena Rostova",
      email: "elena.rostova@worqester.internal",
      role: "HR Manager",
      department: "People & Talent",
      job_title: "Head of People & Culture",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr-05",
      name: "Vikram Patel",
      email: "vikram.patel@worqester.internal",
      role: "Employee",
      department: "Engineering",
      job_title: "Staff Cloud Architect",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  ];

  for (const u of users) {
    const salt = generateSalt();
    const hash = hashPassword(defaultPassword, salt);
    await db.execute(
      `INSERT OR REPLACE INTO users (id, workspace_id, name, email, avatar, role, department, job_title, salt, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, workspaceId, u.name, u.email, u.avatar, u.role, u.department, u.job_title, salt, hash, now]
    );
  }

  // 3. Projects
  if (!isAutoSeed) console.log("[Seed] Seeding normalized enterprise projects...");
  const projects = [
    { id: "proj-101", code: "CIM-2026", name: "Cloud Infrastructure Modernization", status: "In Progress", health: "Healthy", budget: 12500000, spent: 4800000, owner_id: "usr-03", progress: 68 },
    { id: "proj-102", code: "ACP-2026", name: "AI Customer Intelligence Portal", status: "In Progress", health: "Healthy", budget: 8500000, spent: 3100000, owner_id: "usr-03", progress: 45 },
    { id: "proj-103", code: "ECA-2026", name: "Enterprise Cybersecurity Assessment", status: "In Progress", health: "Watch", budget: 4200000, spent: 2900000, owner_id: "usr-05", progress: 75 },
  ];
  for (const p of projects) {
    await db.execute(
      `INSERT OR REPLACE INTO projects (id, workspace_id, name, code, status, health, budget, spent, owner_id, progress, start_date, end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '2026-01-10', '2026-11-30', ?, ?)`,
      [p.id, workspaceId, p.name, p.code, p.status, p.health, p.budget, p.spent, p.owner_id, p.progress, now, now]
    );
  }

  // 4. Milestones
  if (!isAutoSeed) console.log("[Seed] Seeding project milestones...");
  const milestones = [
    { id: "mls-01", project_id: "proj-101", title: "Phase 1: Multi-Region Kubernetes Migration", due_date: "2026-04-15", status: "Completed" },
    { id: "mls-02", project_id: "proj-101", title: "Phase 2: Automated Zero-Downtime CI/CD Pipeline", due_date: "2026-06-30", status: "In Progress" },
    { id: "mls-03", project_id: "proj-102", title: "LLM Pipeline & Context Vector Store Deployment", due_date: "2026-05-20", status: "In Progress" },
  ];
  for (const m of milestones) {
    await db.execute(
      `INSERT OR REPLACE INTO milestones (id, workspace_id, project_id, title, due_date, status, deliverable_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'Milestone', ?, ?)`,
      [m.id, workspaceId, m.project_id, m.title, m.due_date, m.status, now, now]
    );
  }

  // 5. Tasks
  if (!isAutoSeed) console.log("[Seed] Seeding project tasks...");
  const tasks = [
    { id: "tsk-01", project_id: "proj-101", assignee_id: "usr-05", title: "Deploy Terraform Multi-Region Infrastructure", priority: "High", status: "In Progress", due_date: "2026-04-10" },
    { id: "tsk-02", project_id: "proj-101", assignee_id: "usr-03", title: "Configure Vault Dynamic Secret Rotation", priority: "Critical", status: "To Do", due_date: "2026-04-18" },
    { id: "tsk-03", project_id: "proj-102", assignee_id: "usr-05", title: "Benchmark Embeddings Model Inference Latency", priority: "Medium", status: "In Progress", due_date: "2026-04-22" },
  ];
  for (const t of tasks) {
    await db.execute(
      `INSERT OR REPLACE INTO tasks (id, workspace_id, project_id, title, description, assignee_id, priority, status, due_date, estimated_hours, actual_hours, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'Automated Task Implementation', ?, ?, ?, ?, 40, 16, ?, ?)`,
      [t.id, workspaceId, t.project_id, t.title, t.assignee_id, t.priority, t.status, t.due_date, now, now]
    );
  }

  // 6. Employees
  if (!isAutoSeed) console.log("[Seed] Seeding HRM employees...");
  const employees = [
    { id: "emp-01", user_id: "usr-01", full_name: "Alex Vance", email: "alex.vance@worqester.internal", employee_number: "WQ-1001", department: "Executive", designation: "Chief Executive Officer", salary: 3500000, bank: "HDFC •••• 9012" },
    { id: "emp-02", user_id: "usr-02", full_name: "Priya Sharma", email: "priya.sharma@worqester.internal", employee_number: "WQ-1002", department: "Operations", designation: "Chief Operating Officer", salary: 2800000, bank: "ICICI •••• 3451" },
    { id: "emp-03", user_id: "usr-03", full_name: "Marcus Reed", email: "marcus.reed@worqester.internal", employee_number: "WQ-1003", department: "Engineering", designation: "VP of Engineering", salary: 2400000, bank: "SBI •••• 8823" },
    { id: "emp-04", user_id: "usr-04", full_name: "Elena Rostova", email: "elena.rostova@worqester.internal", employee_number: "WQ-1004", department: "People & Talent", designation: "Head of People & Culture", salary: 1950000, bank: "Axis •••• 7712" },
    { id: "emp-05", user_id: "usr-05", full_name: "Vikram Patel", email: "vikram.patel@worqester.internal", employee_number: "WQ-1005", department: "Engineering", designation: "Staff Cloud Architect", salary: 1850000, bank: "Kotak •••• 4409" },
  ];
  for (const e of employees) {
    await db.execute(
      `INSERT OR REPLACE INTO employees (id, workspace_id, user_id, full_name, email, employee_number, department, designation, salary_basic, bank_account_masked, work_mode, location, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Hybrid', 'Bangalore HQ', ?, ?)`,
      [e.id, workspaceId, e.user_id, e.full_name, e.email, e.employee_number, e.department, e.designation, e.salary, e.bank, now, now]
    );
  }

  // 7. Assets
  if (!isAutoSeed) console.log("[Seed] Seeding company assets...");
  const assets = [
    { id: "ast-01", name: "Apple MacBook Pro M3 Max 16\"", category: "Hardware", serial: "WQ-HW-MBP-01", employee_id: "emp-01" },
    { id: "ast-02", name: "Dell UltraSharp 32\" 4K Monitor", category: "Peripheral", serial: "WQ-HW-MON-02", employee_id: "emp-03" },
    { id: "ast-03", name: "Apple MacBook Air M3 15\"", category: "Hardware", serial: "WQ-HW-MBA-03", employee_id: "emp-05" },
  ];
  for (const a of assets) {
    await db.execute(
      `INSERT OR REPLACE INTO assets (id, workspace_id, name, category, serial_number, employee_id, condition, status, allocated_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'New', 'Assigned', '2026-01-15', ?, ?)`,
      [a.id, workspaceId, a.name, a.category, a.serial, a.employee_id, now, now]
    );
  }

  // 8. RBAC Matrix
  if (!isAutoSeed) console.log("[Seed] Seeding role-based access control capabilities...");
  const rbacCapabilities = [
    { cap: "View Enterprise Dashboard & KPIs", super: 1, exec: 1, pm: 1, emp: 1 },
    { cap: "Create & Edit CRM Deals / Accounts", super: 1, exec: 1, pm: 1, emp: 0 },
    { cap: "Manage Employee Profiles & Salaries", super: 1, exec: 0, pm: 0, emp: 0 },
    { cap: "Approve / Reject Leave Requests", super: 1, exec: 1, pm: 1, emp: 0 },
    { cap: "Manage Project Budgets & Roadmaps", super: 1, exec: 1, pm: 1, emp: 0 },
    { cap: "Execute AI Operations Audit", super: 1, exec: 1, pm: 1, emp: 0 },
    { cap: "Mark Personal Daily Attendance", super: 1, exec: 1, pm: 1, emp: 1 },
    { cap: "Access Organization System Settings", super: 1, exec: 0, pm: 0, emp: 0 },
  ];
  for (const r of rbacCapabilities) {
    await db.execute(
      `INSERT OR REPLACE INTO rbac_permissions (workspace_id, capability, super_admin, executive, project_manager, employee, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [workspaceId, r.cap, r.super, r.exec, r.pm, r.emp, now]
    );
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  if (!isAutoSeed) {
    console.log(`\n[Seed] SUCCESS: Database successfully seeded with demo entities in ${duration}s.`);
    console.log(`[Seed] Demo Login: alex.vance@worqester.internal / ${defaultPassword}`);
  }
}
