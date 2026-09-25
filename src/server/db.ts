import path from "path";
import fs from "fs";
import crypto from "crypto";

export interface DatabaseAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<number>;
  transaction<T>(callback: (tx: DatabaseAdapter) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  isPostgres(): boolean;
}

export type IDatabase = DatabaseAdapter;

export function generateSalt(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  // OWASP recommendation: PBKDF2-HMAC-SHA256 >= 600,000 iterations, 32-byte key
  return crypto.pbkdf2Sync(password, salt, 600000, 32, "sha256").toString("hex");
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const hash = crypto.pbkdf2Sync(password, salt, 600000, 32, "sha256").toString("hex");
    if (crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"))) {
      return true;
    }
  } catch {}

  // Fallback for legacy 10,000 iteration hashes from development transition
  try {
    const legacyHash = crypto.pbkdf2Sync(password, salt, 10000, 32, "sha256").toString("hex");
    if (crypto.timingSafeEqual(Buffer.from(legacyHash, "hex"), Buffer.from(storedHash, "hex"))) {
      return true;
    }
  } catch {}

  return false;
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sanitizeParams(params?: any[]): any[] {
  if (!params) return [];
  return params.map((p) => (p === undefined ? null : p));
}

function convertPlaceholders(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

class PostgresAdapter implements DatabaseAdapter {
  private pool: any;

  constructor(pool: any) {
    this.pool = pool;
  }

  isPostgres(): boolean {
    return true;
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const pgSql = convertPlaceholders(sql);
    const sanitized = sanitizeParams(params);
    const res = await this.pool.query(pgSql, sanitized);
    return res.rows as T[];
  }

  async execute(sql: string, params?: any[]): Promise<number> {
    const pgSql = convertPlaceholders(sql);
    const sanitized = sanitizeParams(params);
    const res = await this.pool.query(pgSql, sanitized);
    return res.rowCount || 0;
  }

  async transaction<T>(callback: (tx: DatabaseAdapter) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    const txAdapter: DatabaseAdapter = {
      isPostgres: () => true,
      async query<R = any>(sql: string, params?: any[]): Promise<R[]> {
        const pgSql = convertPlaceholders(sql);
        const res = await client.query(pgSql, sanitizeParams(params));
        return res.rows as R[];
      },
      async execute(sql: string, params?: any[]): Promise<number> {
        const pgSql = convertPlaceholders(sql);
        const res = await client.query(pgSql, sanitizeParams(params));
        return res.rowCount || 0;
      },
      async transaction<R>(nestedCb: (innerTx: DatabaseAdapter) => Promise<R>): Promise<R> {
        return nestedCb(this);
      },
      async close(): Promise<void> {},
    };

    try {
      await client.query("BEGIN");
      const result = await callback(txAdapter);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

class SqliteAdapter implements DatabaseAdapter {
  private db: any;

  constructor(db: any) {
    this.db = db;
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec("PRAGMA journal_mode = WAL;");
  }

  isPostgres(): boolean {
    return false;
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const sanitized = sanitizeParams(params);
    const stmt = this.db.prepare(sql);
    return stmt.all(...sanitized) as T[];
  }

  async execute(sql: string, params?: any[]): Promise<number> {
    const sanitized = sanitizeParams(params);
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...sanitized);
    return info.changes || 0;
  }

  async transaction<T>(callback: (tx: DatabaseAdapter) => Promise<T>): Promise<T> {
    this.db.exec("BEGIN IMMEDIATE;");
    try {
      const result = await callback(this);
      this.db.exec("COMMIT;");
      return result;
    } catch (err) {
      try {
        this.db.exec("ROLLBACK;");
      } catch {}
      throw err;
    }
  }

  async close(): Promise<void> {
    if (this.db && typeof this.db.close === "function") {
      this.db.close();
    }
  }
}

let dbInstance: DatabaseAdapter | null = null;

export async function getDatabase(): Promise<DatabaseAdapter> {
  if (dbInstance) return dbInstance;

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    console.log("[Database] Initializing PostgreSQL connection pool from DATABASE_URL...");
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
    });
    dbInstance = new PostgresAdapter(pool);
  } else {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_SQLITE_PROD !== "true") {
      throw new Error(
        "[Database Fatal] Running in production requires a valid DATABASE_URL pointing to PostgreSQL. SQLite fallback is strictly prohibited in production environments to avoid ephemeral data loss on container restarts."
      );
    }
    console.log("[Database] Initializing SQLite local database (worqester.db)...");
    const { DatabaseSync } = await import("node:sqlite");
    const dbPath = path.resolve(process.cwd(), "worqester.db");
    const sqliteDb = new DatabaseSync(dbPath);
    dbInstance = new SqliteAdapter(sqliteDb);
  }

  await runMigrations(dbInstance);
  return dbInstance;
}

async function addColumnIfNotExists(
  tx: DatabaseAdapter,
  tableName: string,
  columnName: string,
  columnDef: string
): Promise<void> {
  let hasColumn = false;
  if (tx.isPostgres()) {
    const rows = await tx.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = ? AND column_name = ?",
      [tableName.toLowerCase(), columnName.toLowerCase()]
    );
    hasColumn = rows.length > 0;
  } else {
    const rows = await tx.query(`PRAGMA table_info(${tableName})`);
    hasColumn = rows.some((r: any) => r.name.toLowerCase() === columnName.toLowerCase());
  }

  if (!hasColumn) {
    console.log(`[Database Migration] Adding column ${tableName}.${columnName}...`);
    await tx.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
  }
}

export async function runMigrations(db: DatabaseAdapter): Promise<void> {
  // Ensure schema_migrations tracker table exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(64) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedRows = await db.query<{ version: string }>(
    "SELECT version FROM schema_migrations"
  );
  const applied = new Set(appliedRows.map((r) => r.version));

  if (!applied.has("001_normalized_relational_schema")) {
    console.log("[Database Migration] Applying 001_normalized_relational_schema...");
    if (!db.isPostgres()) {
      await db.execute("PRAGMA foreign_keys = OFF;");
    }

    try {
      await db.transaction(async (tx) => {
        // 1. Workspaces
        await tx.execute(`
          CREATE TABLE IF NOT EXISTS workspaces (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(128) NOT NULL,
            plan VARCHAR(64) DEFAULT 'Enterprise',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Ensure any workspaces referenced in legacy tables exist
        await tx.execute(`
          INSERT OR IGNORE INTO workspaces (id, name, slug)
          SELECT DISTINCT workspace_id, 'Workspace ' || workspace_id, 'workspace-' || workspace_id
          FROM users
          WHERE workspace_id IS NOT NULL AND workspace_id NOT IN (SELECT id FROM workspaces);
        `).catch(() => {});

        // 2. Users (workspace-scoped email uniqueness)
        await tx.execute(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(64) PRIMARY KEY,
            workspace_id VARCHAR(64) NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            avatar TEXT,
            role VARCHAR(64) NOT NULL,
            department VARCHAR(128) NOT NULL,
            job_title VARCHAR(128),
            password_hash VARCHAR(255) NOT NULL,
            salt VARCHAR(128) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
            UNIQUE (workspace_id, email)
          );
        `);

        // SQLite migration for existing tables created with global UNIQUE constraints
        if (!tx.isPostgres()) {
          const userTable = await tx.query<{ sql: string }>(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
          );
          if (userTable.length > 0 && userTable[0].sql && userTable[0].sql.includes("email TEXT UNIQUE")) {
            console.log("[Database Migration] Migrating users table to workspace-scoped email uniqueness...");
            await tx.execute(`
              CREATE TABLE users_migrated (
                id VARCHAR(64) PRIMARY KEY,
                workspace_id VARCHAR(64) NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                avatar TEXT,
                role VARCHAR(64) NOT NULL,
                department VARCHAR(128) NOT NULL,
                job_title VARCHAR(128),
                password_hash VARCHAR(255) NOT NULL,
                salt VARCHAR(128) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
                UNIQUE (workspace_id, email)
              );
            `);
            await tx.execute(`
              INSERT INTO users_migrated (id, workspace_id, name, email, avatar, role, department, job_title, password_hash, salt, created_at)
              SELECT id, workspace_id, name, email, avatar, role, department, job_title, password_hash, salt, created_at FROM users;
            `);
            await tx.execute("DROP TABLE users;");
            await tx.execute("ALTER TABLE users_migrated RENAME TO users;");
          }

        const assetTable = await tx.query<{ sql: string }>(
          "SELECT sql FROM sqlite_master WHERE type='table' AND name='assets'"
        );
        if (assetTable.length > 0 && assetTable[0].sql && assetTable[0].sql.includes("serial_number TEXT UNIQUE")) {
          console.log("[Database Migration] Migrating assets table to workspace-scoped serial_number uniqueness...");
          await tx.execute(`
            UPDATE assets SET employee_id = NULL
            WHERE employee_id IS NOT NULL AND employee_id NOT IN (SELECT id FROM employees)
          `).catch(() => {});
          await tx.execute(`
            CREATE TABLE assets_migrated (
              id VARCHAR(64) PRIMARY KEY,
              workspace_id VARCHAR(64) NOT NULL,
              name VARCHAR(255) NOT NULL,
              category VARCHAR(128) DEFAULT 'Hardware',
              serial_number VARCHAR(128) NOT NULL,
              employee_id VARCHAR(64),
              condition VARCHAR(64) DEFAULT 'New',
              status VARCHAR(64) DEFAULT 'Assigned',
              allocated_date VARCHAR(64),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
              FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
              UNIQUE (workspace_id, serial_number)
            );
          `);
          await tx.execute(`
            INSERT INTO assets_migrated (id, workspace_id, name, category, serial_number, employee_id, condition, status, allocated_date, created_at, updated_at)
            SELECT id, workspace_id, name, category, serial_number, employee_id, condition, status, allocated_date, created_at, updated_at FROM assets;
          `);
          await tx.execute("DROP TABLE assets;");
          await tx.execute("ALTER TABLE assets_migrated RENAME TO assets;");
        }
      }

      // 3. Sessions (hashed session tokens with expiration)
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
          token_hash VARCHAR(128) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          workspace_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        );
      `);

      // Handle existing sessions table migration (if created in earlier version with token as PK)
      await addColumnIfNotExists(tx, "sessions", "token_hash", "VARCHAR(128)");
      await tx.execute("UPDATE sessions SET token_hash = token WHERE token_hash IS NULL AND token IS NOT NULL").catch(() => {});

      // 4. Projects (workspace-scoped code uniqueness)
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id VARCHAR(64) PRIMARY KEY,
          workspace_id VARCHAR(64) NOT NULL,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(64) NOT NULL,
          status VARCHAR(64) DEFAULT 'In Progress',
          health VARCHAR(64) DEFAULT 'Healthy',
          budget REAL DEFAULT 0,
          spent REAL DEFAULT 0,
          owner_id VARCHAR(64),
          progress INTEGER DEFAULT 0,
          start_date VARCHAR(64),
          end_date VARCHAR(64),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
          UNIQUE (workspace_id, code)
        );
      `);
      await addColumnIfNotExists(tx, "projects", "owner_id", "VARCHAR(64)");

      // 5. Milestones (foreign key to projects)
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS milestones (
          id VARCHAR(64) PRIMARY KEY,
          workspace_id VARCHAR(64) NOT NULL,
          project_id VARCHAR(64) NOT NULL,
          title VARCHAR(255) NOT NULL,
          due_date VARCHAR(64),
          status VARCHAR(64) DEFAULT 'In Progress',
          deliverable_type VARCHAR(64) DEFAULT 'Milestone',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
      `);

      if (!tx.isPostgres()) {
        const milestoneFks = await tx.query("PRAGMA foreign_key_list(milestones);");
        if (milestoneFks.length === 0) {
          console.log("[Database Migration] Migrating milestones table to relational foreign keys with cascade delete...");
          await tx.execute(`
            CREATE TABLE milestones_migrated (
              id VARCHAR(64) PRIMARY KEY,
              workspace_id VARCHAR(64) NOT NULL,
              project_id VARCHAR(64) NOT NULL,
              title VARCHAR(255) NOT NULL,
              due_date VARCHAR(64),
              status VARCHAR(64) DEFAULT 'In Progress',
              deliverable_type VARCHAR(64) DEFAULT 'Milestone',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
              FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );
          `);
          await tx.execute(`
            INSERT INTO milestones_migrated (id, workspace_id, project_id, title, due_date, status, deliverable_type, created_at, updated_at)
            SELECT m.id, m.workspace_id, m.project_id, m.title, m.due_date, m.status, m.deliverable_type, m.created_at, m.updated_at
            FROM milestones m
            WHERE m.project_id IN (SELECT id FROM projects) AND m.workspace_id IN (SELECT id FROM workspaces);
          `);
          await tx.execute("DROP TABLE milestones;");
          await tx.execute("ALTER TABLE milestones_migrated RENAME TO milestones;");
        }
      }

      // 6. Tasks (foreign keys to projects and users)
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR(64) PRIMARY KEY,
          workspace_id VARCHAR(64) NOT NULL,
          project_id VARCHAR(64) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          comments TEXT,
          notes TEXT,
          assignee_id VARCHAR(64),
          priority VARCHAR(32) DEFAULT 'Medium',
          status VARCHAR(32) DEFAULT 'To Do',
          due_date VARCHAR(64),
          estimated_hours REAL DEFAULT 0,
          actual_hours REAL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
        );
      `);

      if (!tx.isPostgres()) {
        const taskFks = await tx.query("PRAGMA foreign_key_list(tasks);");
        if (taskFks.length === 0) {
          console.log("[Database Migration] Migrating tasks table to relational foreign keys...");
          await tx.execute(`
            CREATE TABLE tasks_migrated (
              id VARCHAR(64) PRIMARY KEY,
              workspace_id VARCHAR(64) NOT NULL,
              project_id VARCHAR(64) NOT NULL,
              title VARCHAR(255) NOT NULL,
              description TEXT,
              comments TEXT,
              notes TEXT,
              assignee_id VARCHAR(64),
              priority VARCHAR(32) DEFAULT 'Medium',
              status VARCHAR(32) DEFAULT 'To Do',
              due_date VARCHAR(64),
              estimated_hours REAL DEFAULT 0,
              actual_hours REAL DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
              FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
              FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
            );
          `);
          await tx.execute(`
            INSERT INTO tasks_migrated (id, workspace_id, project_id, title, description, assignee_id, priority, status, due_date, estimated_hours, actual_hours, created_at, updated_at)
            SELECT t.id, t.workspace_id, t.project_id, t.title, t.description,
              CASE WHEN t.assignee_id IN (SELECT id FROM users) THEN t.assignee_id ELSE NULL END,
              t.priority, t.status, t.due_date, t.estimated_hours, t.actual_hours, t.created_at, t.updated_at
            FROM tasks t
            WHERE t.project_id IN (SELECT id FROM projects) AND t.workspace_id IN (SELECT id FROM workspaces);
          `);
          await tx.execute("DROP TABLE tasks;");
          await tx.execute("ALTER TABLE tasks_migrated RENAME TO tasks;");
        }
      }
      await addColumnIfNotExists(tx, "tasks", "comments", "TEXT");
      await addColumnIfNotExists(tx, "tasks", "notes", "TEXT");

      // 7. Deals (foreign key to owner user)
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS deals (
          id VARCHAR(64) PRIMARY KEY,
          workspace_id VARCHAR(64) NOT NULL,
          title VARCHAR(255) NOT NULL,
          company_name VARCHAR(255) NOT NULL,
          amount REAL DEFAULT 0,
          stage VARCHAR(64) DEFAULT 'Qualification',
          probability INTEGER DEFAULT 30,
          expected_close_date VARCHAR(64),
          owner_id VARCHAR(64),
          priority VARCHAR(32) DEFAULT 'Medium',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
        );
      `);
      await addColumnIfNotExists(tx, "deals", "owner_id", "VARCHAR(64)");

      // 8. Leads (foreign key to assigned user)
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS leads (
          id VARCHAR(64) PRIMARY KEY,
          workspace_id VARCHAR(64) NOT NULL,
          contact_name VARCHAR(255) NOT NULL,
          company VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          status VARCHAR(64) DEFAULT 'New',
          expected_value REAL DEFAULT 0,
          source VARCHAR(128) DEFAULT 'Website',
          score INTEGER DEFAULT 50,
          assigned_to_id VARCHAR(64),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
        );
      `);
      await addColumnIfNotExists(tx, "leads", "assigned_to_id", "VARCHAR(64)");

      // 9. Employees (workspace-scoped email & employee_number)
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS employees (
          id VARCHAR(64) PRIMARY KEY,
          workspace_id VARCHAR(64) NOT NULL,
          user_id VARCHAR(64),
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          employee_number VARCHAR(64) NOT NULL,
          department VARCHAR(128) NOT NULL,
          designation VARCHAR(128) NOT NULL,
          salary_basic REAL DEFAULT 0,
          bank_account_masked VARCHAR(64),
          work_mode VARCHAR(64) DEFAULT 'Hybrid',
          location VARCHAR(128),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          UNIQUE (workspace_id, email),
          UNIQUE (workspace_id, employee_number)
        );
      `);
      await addColumnIfNotExists(tx, "employees", "user_id", "VARCHAR(64)");

      // 10. Expenses (foreign key to employees & projects)
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS expenses (
          id VARCHAR(64) PRIMARY KEY,
          workspace_id VARCHAR(64) NOT NULL,
          employee_id VARCHAR(64) NOT NULL,
          project_id VARCHAR(64),
          category VARCHAR(128) DEFAULT 'General',
          amount REAL DEFAULT 0,
          date VARCHAR(64),
          description TEXT,
          status VARCHAR(64) DEFAULT 'Pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
        );
      `);
      await addColumnIfNotExists(tx, "expenses", "project_id", "VARCHAR(64)");

      // 11. Assets (workspace-scoped serial_number & foreign key to employee)
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS assets (
          id VARCHAR(64) PRIMARY KEY,
          workspace_id VARCHAR(64) NOT NULL,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(128) DEFAULT 'Hardware',
          serial_number VARCHAR(128) NOT NULL,
          employee_id VARCHAR(64),
          condition VARCHAR(64) DEFAULT 'New',
          status VARCHAR(64) DEFAULT 'Assigned',
          allocated_date VARCHAR(64),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
          UNIQUE (workspace_id, serial_number)
        );
      `);

      // 12. Job Positions
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS job_positions (
          id VARCHAR(64) PRIMARY KEY,
          workspace_id VARCHAR(64) NOT NULL,
          title VARCHAR(255) NOT NULL,
          department VARCHAR(128) NOT NULL,
          status VARCHAR(64) DEFAULT 'Open',
          openings INTEGER DEFAULT 1,
          salary_range VARCHAR(128),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        );
      `);

      // 13. Candidates (foreign key to job_positions)
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS candidates (
          id VARCHAR(64) PRIMARY KEY,
          workspace_id VARCHAR(64) NOT NULL,
          position_id VARCHAR(64) NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          experience_years REAL DEFAULT 0,
          rating REAL DEFAULT 4.5,
          stage VARCHAR(64) DEFAULT 'Screening',
          applied_date VARCHAR(64),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (position_id) REFERENCES job_positions(id) ON DELETE CASCADE
        );
      `);

      // 14. Invitations (foreign key to inviting user)
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS invitations (
          id VARCHAR(64) PRIMARY KEY,
          workspace_id VARCHAR(64) NOT NULL,
          email VARCHAR(255) NOT NULL,
          role VARCHAR(64) NOT NULL,
          department VARCHAR(128) NOT NULL,
          invited_by_id VARCHAR(64),
          status VARCHAR(64) DEFAULT 'Pending',
          sent_date VARCHAR(64),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (invited_by_id) REFERENCES users(id) ON DELETE SET NULL
        );
      `);
      await addColumnIfNotExists(tx, "invitations", "invited_by_id", "VARCHAR(64)");

      // 15. RBAC Permissions (composite PK)
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS rbac_permissions (
          workspace_id VARCHAR(64) NOT NULL,
          capability VARCHAR(255) NOT NULL,
          super_admin INTEGER DEFAULT 1,
          executive INTEGER DEFAULT 1,
          project_manager INTEGER DEFAULT 1,
          employee INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (workspace_id, capability),
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        );
      `);
      await addColumnIfNotExists(tx, "rbac_permissions", "updated_at", "TIMESTAMP");

      // 16. Audit Logs
      await tx.execute(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(64) PRIMARY KEY,
          workspace_id VARCHAR(64) NOT NULL,
          user_id VARCHAR(64),
          user_name VARCHAR(255) NOT NULL,
          user_role VARCHAR(64) NOT NULL,
          action VARCHAR(128) NOT NULL,
          entity_type VARCHAR(128) NOT NULL,
          entity_name VARCHAR(255) NOT NULL,
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
      `);
      await addColumnIfNotExists(tx, "audit_logs", "user_id", "VARCHAR(64)");
      await addColumnIfNotExists(tx, "audit_logs", "created_at", "TIMESTAMP");
      await tx.execute("UPDATE audit_logs SET created_at = timestamp WHERE created_at IS NULL AND timestamp IS NOT NULL").catch(() => {});

      // Deduplicate any conflicting rows in legacy databases before creating unique indexes
      await tx.execute("DELETE FROM projects WHERE id NOT IN (SELECT MIN(id) FROM projects GROUP BY workspace_id, code);").catch(() => {});
      await tx.execute("DELETE FROM employees WHERE id NOT IN (SELECT MIN(id) FROM employees GROUP BY workspace_id, email);").catch(() => {});
      await tx.execute("DELETE FROM employees WHERE id NOT IN (SELECT MIN(id) FROM employees GROUP BY workspace_id, employee_number);").catch(() => {});
      await tx.execute("DELETE FROM assets WHERE id NOT IN (SELECT MIN(id) FROM assets GROUP BY workspace_id, serial_number);").catch(() => {});

      // Indexes for performance & query isolation
      await tx.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_ws_email ON employees(workspace_id, email);");
      await tx.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_ws_empno ON employees(workspace_id, employee_number);");
      await tx.execute("CREATE INDEX IF NOT EXISTS idx_users_ws_email ON users(workspace_id, email);");
      await tx.execute("CREATE INDEX IF NOT EXISTS idx_sessions_hash_exp ON sessions(token_hash, expires_at);");
      await tx.execute("DROP INDEX IF EXISTS idx_projects_ws_code;");
      await tx.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_ws_code ON projects(workspace_id, code);");
      await tx.execute("DROP INDEX IF EXISTS idx_assets_ws_serial;");
      await tx.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_ws_serial ON assets(workspace_id, serial_number);");
      await tx.execute("CREATE INDEX IF NOT EXISTS idx_milestones_ws_proj ON milestones(workspace_id, project_id);");
      await tx.execute("CREATE INDEX IF NOT EXISTS idx_tasks_ws_proj_stat ON tasks(workspace_id, project_id, status);");
      await tx.execute("CREATE INDEX IF NOT EXISTS idx_deals_ws_stage ON deals(workspace_id, stage);");
      await tx.execute("CREATE INDEX IF NOT EXISTS idx_leads_ws_status ON leads(workspace_id, status);");
      await tx.execute("CREATE INDEX IF NOT EXISTS idx_expenses_ws_status ON expenses(workspace_id, status);");
      await tx.execute("CREATE INDEX IF NOT EXISTS idx_assets_ws_emp ON assets(workspace_id, employee_id);");
      await tx.execute("CREATE INDEX IF NOT EXISTS idx_candidates_ws_pos ON candidates(workspace_id, position_id);");
      await tx.execute("CREATE INDEX IF NOT EXISTS idx_audit_ws_created ON audit_logs(workspace_id, created_at);");

      // Mark migration as applied
      await tx.execute(
        "INSERT INTO schema_migrations (version) VALUES (?)",
        ["001_normalized_relational_schema"]
      );
    });
    } finally {
      if (!db.isPostgres()) {
        await db.execute("PRAGMA foreign_keys = ON;").catch(() => {});
      }
    }
    console.log("[Database Migration] Successfully applied 001_normalized_relational_schema.");
  }

  if (!applied.has("002_add_employee_user_id")) {
    console.log("[Database Migration] Applying 002_add_employee_user_id...");
    await db.transaction(async (tx) => {
      await addColumnIfNotExists(tx, "employees", "user_id", "VARCHAR(64)");
      await tx.execute("CREATE INDEX IF NOT EXISTS idx_employees_ws_user ON employees(workspace_id, user_id);");
      await tx.execute("INSERT INTO schema_migrations (version) VALUES (?)", ["002_add_employee_user_id"]);
    });
    console.log("[Database Migration] Successfully applied 002_add_employee_user_id.");
  }

  if (!applied.has("003_add_task_comments_notes_and_fields")) {
    console.log("[Database Migration] Applying 003_add_task_comments_notes_and_fields...");
    await db.transaction(async (tx) => {
      await addColumnIfNotExists(tx, "tasks", "comments", "TEXT");
      await addColumnIfNotExists(tx, "tasks", "notes", "TEXT");
      await addColumnIfNotExists(tx, "projects", "owner_name", "VARCHAR(255)");
      await addColumnIfNotExists(tx, "projects", "description", "TEXT");
      await addColumnIfNotExists(tx, "assets", "model", "VARCHAR(128)");
      await tx.execute("INSERT INTO schema_migrations (version) VALUES (?)", ["003_add_task_comments_notes_and_fields"]);
    });
    console.log("[Database Migration] Successfully applied 003_add_task_comments_notes_and_fields.");
  }
}
