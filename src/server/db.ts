import path from "path";
import crypto from "crypto";

import { Pool, PoolClient } from "pg";
import { DatabaseSync } from "node:sqlite";

// ============================================================
// Types
// ============================================================

export interface DatabaseAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<number>;
  transaction<T>(callback: (db: DatabaseAdapter) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  isPostgres(): boolean;
}

export type IDatabase = DatabaseAdapter;

// ============================================================
// Password / Security Helpers
// ============================================================

export function generateSalt(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return crypto
    .pbkdf2Sync(password, salt, 600_000, 32, "sha256")
    .toString("hex");
}

export function verifyPassword(
  password: string,
  salt: string,
  storedHash: string
): boolean {
  try {
    const currentHash = crypto
      .pbkdf2Sync(password, salt, 600_000, 32, "sha256")
      .toString("hex");

    if (
      crypto.timingSafeEqual(
        Buffer.from(currentHash, "hex"),
        Buffer.from(storedHash, "hex")
      )
    ) {
      return true;
    }

    // Legacy 10,000 iteration compatibility
    const legacyHash = crypto
      .pbkdf2Sync(password, salt, 10_000, 32, "sha256")
      .toString("hex");

    return (
      legacyHash === storedHash
    );
  } catch {
    return false;
  }
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ============================================================
// SQL Helpers
// ============================================================

function sanitizeParams(params: any[] = []): any[] {
  return params.map((value) => (value === undefined ? null : value));
}

function convertPlaceholders(sql: string): string {
  let index = 0;

  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

// ============================================================
// PostgreSQL Adapter
// ============================================================

class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool;

  constructor(databaseUrl: string) {
    console.log(
      "[Database] Initializing PostgreSQL connection pool from DATABASE_URL..."
    );

    const sslEnabled = process.env.DATABASE_SSL !== "false";

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
      ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    });
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await this.pool.query(
      convertPlaceholders(sql),
      sanitizeParams(params)
    );

    return result.rows as T[];
  }

  async execute(sql: string, params: any[] = []): Promise<number> {
    const result = await this.pool.query(
      convertPlaceholders(sql),
      sanitizeParams(params)
    );

    return result.rowCount ?? 0;
  }

  async transaction<T>(
    callback: (db: DatabaseAdapter) => Promise<T>
  ): Promise<T> {
    const client: PoolClient = await this.pool.connect();

    const txAdapter: DatabaseAdapter = {
      query: async <R = any>(sql: string, params: any[] = []) => {
        const result = await client.query(
          convertPlaceholders(sql),
          sanitizeParams(params)
        );
        return result.rows as R[];
      },

      execute: async (sql: string, params: any[] = []) => {
        const result = await client.query(
          convertPlaceholders(sql),
          sanitizeParams(params)
        );
        return result.rowCount ?? 0;
      },

      transaction: async <R>(
        nestedCallback: (db: DatabaseAdapter) => Promise<R>
      ) => {
        // PostgreSQL does not support nested BEGIN transactions.
        // Execute nested transaction callbacks using the same client.
        return nestedCallback(txAdapter);
      },

      close: async () => {
        // Do not close the shared pool from inside a transaction.
      },

      isPostgres: () => true,
    };

    try {
      await client.query("BEGIN");

      const result = await callback(txAdapter);

      await client.query("COMMIT");

      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Ignore rollback errors.
      }

      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  isPostgres(): boolean {
    return true;
  }
}

// ============================================================
// SQLite Adapter
// ============================================================

class SqliteAdapter implements DatabaseAdapter {
  private db: DatabaseSync;

  constructor(filename: string) {
    this.db = new DatabaseSync(filename);

    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec("PRAGMA journal_mode = WAL;");
  }

  async query<T = any>(
    sql: string,
    params: any[] = []
  ): Promise<T[]> {
    const statement = this.db.prepare(sql);
    return statement.all(...sanitizeParams(params)) as T[];
  }

  async execute(
    sql: string,
    params: any[] = []
  ): Promise<number> {
    const statement = this.db.prepare(sql);
    const result: any = statement.run(...sanitizeParams(params));

    return Number(result?.changes ?? 0);
  }

  async transaction<T>(
    callback: (db: DatabaseAdapter) => Promise<T>
  ): Promise<T> {
    this.db.exec("BEGIN");

    try {
      const result = await callback(this);

      this.db.exec("COMMIT");

      return result;
    } catch (error) {
      try {
        this.db.exec("ROLLBACK");
      } catch {
        // Ignore rollback errors.
      }

      throw error;
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }

  isPostgres(): boolean {
    return false;
  }
}

// ============================================================
// Database Singleton
// ============================================================

let databaseInstance: DatabaseAdapter | null = null;

export async function getDatabase(): Promise<DatabaseAdapter> {
  if (databaseInstance) {
    return databaseInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    databaseInstance = new PostgresAdapter(databaseUrl);
  } else {
    if (process.env.NODE_ENV === "production") {
      if (process.env.ALLOW_SQLITE_PROD !== "true") {
        throw new Error(
          "DATABASE_URL is required in production. SQLite fallback is disabled."
        );
      }
    }

    const dbPath =
      process.env.SQLITE_DB_PATH ||
      path.join(process.cwd(), "worqester.db");

    console.log(`[Database] Using SQLite database: ${dbPath}`);

    databaseInstance = new SqliteAdapter(dbPath);
  }

  await runMigrations(databaseInstance);

  return databaseInstance;
}

// ============================================================
// Schema Utilities
// ============================================================

async function addColumnIfNotExists(
  db: DatabaseAdapter,
  table: string,
  column: string,
  definition: string
): Promise<void> {
  if (db.isPostgres()) {
    const rows = await db.query(
      `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = ?
        AND column_name = ?
      LIMIT 1
      `,
      [table, column]
    );

    if (rows.length === 0) {
      await db.execute(
        `ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`
      );
    }
  } else {
    const rows = await db.query(
      `PRAGMA table_info("${table}")`
    );

    const exists = rows.some(
      (row: any) => row.name === column
    );

    if (!exists) {
      await db.execute(
        `ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`
      );
    }
  }
}

async function tableExists(
  db: DatabaseAdapter,
  table: string
): Promise<boolean> {
  if (db.isPostgres()) {
    const rows = await db.query(
      `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name = ?
      LIMIT 1
      `,
      [table]
    );

    return rows.length > 0;
  }

  const rows = await db.query(
    `
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name = ?
    `,
    [table]
  );

  return rows.length > 0;
}

// ============================================================
// Migrations
// ============================================================

async function runMigrations(
  db: DatabaseAdapter
): Promise<void> {
  // Migration tracking table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const appliedRows = await db.query<{ version: string }>(
    "SELECT version FROM schema_migrations"
  );

  const applied = new Set(
    appliedRows.map((row) => row.version)
  );

  // ==========================================================
  // Migration 001
  // ==========================================================

  if (!applied.has("001_normalized_relational_schema")) {
    console.log(
      "[Database Migration] Applying 001_normalized_relational_schema..."
    );

    await db.transaction(async (tx) => {
      // ------------------------------------------------------
      // 1. Workspaces
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT,
          plan TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT
        )
      `);

      // ------------------------------------------------------
      // 2. Users
      // IMPORTANT: users MUST exist before anything references
      // users.workspace_id.
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          avatar TEXT,
          role TEXT NOT NULL DEFAULT 'Employee',
          department TEXT,
          job_title TEXT,
          salt TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          UNIQUE (workspace_id, email),
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE
        )
      `);

      // ------------------------------------------------------
      // 3. Sessions
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          workspace_id TEXT NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE,
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE
        )
      `);

      // ------------------------------------------------------
      // 4. Projects
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          name TEXT NOT NULL,
          code TEXT,
          description TEXT,
          status TEXT DEFAULT 'In Progress',
          health TEXT DEFAULT 'Healthy',
          budget REAL DEFAULT 0,
          spent REAL DEFAULT 0,
          owner_id TEXT,
          owner_name TEXT,
          progress REAL DEFAULT 0,
          start_date TEXT,
          end_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE,
          FOREIGN KEY (owner_id)
            REFERENCES users(id)
            ON DELETE SET NULL
        )
      `);

      // ------------------------------------------------------
      // 5. Milestones
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS milestones (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          project_id TEXT,
          title TEXT NOT NULL,
          due_date TEXT,
          status TEXT DEFAULT 'In Progress',
          deliverable_type TEXT DEFAULT 'Milestone',
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE,
          FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE CASCADE
        )
      `);

      // ------------------------------------------------------
      // 6. Tasks
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          project_id TEXT,
          title TEXT NOT NULL,
          description TEXT,
          assignee_id TEXT,
          priority TEXT DEFAULT 'Medium',
          status TEXT DEFAULT 'To Do',
          due_date TEXT,
          estimated_hours REAL DEFAULT 0,
          actual_hours REAL DEFAULT 0,
          comments TEXT DEFAULT '[]',
          notes TEXT DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE,
          FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE SET NULL,
          FOREIGN KEY (assignee_id)
            REFERENCES users(id)
            ON DELETE SET NULL
        )
      `);

      // ------------------------------------------------------
      // 7. Deals
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS deals (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          title TEXT NOT NULL,
          company_name TEXT,
          amount REAL DEFAULT 0,
          stage TEXT,
          probability REAL DEFAULT 0,
          expected_close_date TEXT,
          owner_id TEXT,
          owner_name TEXT,
          priority TEXT DEFAULT 'Medium',
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE,
          FOREIGN KEY (owner_id)
            REFERENCES users(id)
            ON DELETE SET NULL
        )
      `);

      // ------------------------------------------------------
      // 8. Leads
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS leads (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          name TEXT,
          company_name TEXT,
          email TEXT,
          phone TEXT,
          source TEXT,
          status TEXT,
          assigned_to_id TEXT,
          assigned_to TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE,
          FOREIGN KEY (assigned_to_id)
            REFERENCES users(id)
            ON DELETE SET NULL
        )
      `);

      // ------------------------------------------------------
      // 9. Employees
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS employees (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          user_id TEXT,
          full_name TEXT NOT NULL,
          email TEXT,
          employee_number TEXT,
          department TEXT,
          designation TEXT,
          salary_basic REAL DEFAULT 0,
          bank_account_masked TEXT,
          work_mode TEXT,
          location TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE,
          FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE SET NULL
        )
      `);

      // ------------------------------------------------------
      // 10. Expenses
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          employee_id TEXT,
          category TEXT,
          amount REAL DEFAULT 0,
          date TEXT,
          description TEXT,
          project_id TEXT,
          status TEXT DEFAULT 'Pending',
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE,
          FOREIGN KEY (employee_id)
            REFERENCES employees(id)
            ON DELETE SET NULL,
          FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE SET NULL
        )
      `);

      // ------------------------------------------------------
      // 11. Assets
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS assets (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          name TEXT NOT NULL,
          category TEXT,
          serial_number TEXT,
          employee_id TEXT,
          condition TEXT,
          status TEXT,
          allocated_date TEXT,
          model TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE,
          FOREIGN KEY (employee_id)
            REFERENCES employees(id)
            ON DELETE SET NULL
        )
      `);

      // ------------------------------------------------------
      // 12. Job Positions
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS job_positions (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          title TEXT NOT NULL,
          department TEXT,
          status TEXT DEFAULT 'Open',
          openings INTEGER DEFAULT 1,
          salary_range TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE
        )
      `);

      // ------------------------------------------------------
      // 13. Candidates
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS candidates (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          position_id TEXT,
          name TEXT NOT NULL,
          email TEXT,
          experience_years REAL DEFAULT 0,
          rating REAL DEFAULT 0,
          stage TEXT DEFAULT 'Screening',
          applied_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE,
          FOREIGN KEY (position_id)
            REFERENCES job_positions(id)
            ON DELETE SET NULL
        )
      `);

      // ------------------------------------------------------
      // 14. Invitations
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS invitations (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          email TEXT NOT NULL,
          role TEXT DEFAULT 'Employee',
          department TEXT DEFAULT 'Operations',
          invited_by TEXT,
          invited_by_id TEXT,
          status TEXT DEFAULT 'Pending',
          sent_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE,
          FOREIGN KEY (invited_by_id)
            REFERENCES users(id)
            ON DELETE SET NULL
        )
      `);

      // ------------------------------------------------------
      // 15. RBAC
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS rbac_permissions (
          id TEXT,
          workspace_id TEXT NOT NULL,
          capability TEXT NOT NULL,
          super_admin INTEGER DEFAULT 0,
          executive INTEGER DEFAULT 0,
          project_manager INTEGER DEFAULT 0,
          employee INTEGER DEFAULT 0,
          updated_at TEXT,
          PRIMARY KEY (workspace_id, capability),
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE
        )
      `);

      // ------------------------------------------------------
      // 16. Audit Logs
      // ------------------------------------------------------

      await tx.execute(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          user_name TEXT,
          user_role TEXT,
          action TEXT,
          entity_type TEXT,
          entity_name TEXT,
          details TEXT,
          timestamp TEXT NOT NULL,
          FOREIGN KEY (workspace_id)
            REFERENCES workspaces(id)
            ON DELETE CASCADE
        )
      `);

      // ------------------------------------------------------
      // Existing/legacy database compatibility
      // ------------------------------------------------------

      await addColumnIfNotExists(
        tx,
        "workspaces",
        "slug",
        "TEXT"
      );

      await addColumnIfNotExists(
        tx,
        "workspaces",
        "plan",
        "TEXT"
      );

      await addColumnIfNotExists(
        tx,
        "workspaces",
        "updated_at",
        "TEXT"
      );

      await addColumnIfNotExists(
        tx,
        "users",
        "updated_at",
        "TEXT"
      );

      await addColumnIfNotExists(
        tx,
        "projects",
        "owner_name",
        "TEXT"
      );

      await addColumnIfNotExists(
        tx,
        "projects",
        "description",
        "TEXT"
      );

      await addColumnIfNotExists(
        tx,
        "deals",
        "owner_name",
        "TEXT"
      );

      await addColumnIfNotExists(
        tx,
        "leads",
        "assigned_to",
        "TEXT"
      );

      await addColumnIfNotExists(
        tx,
        "leads",
        "assigned_to_id",
        "TEXT"
      );

      await addColumnIfNotExists(
        tx,
        "employees",
        "user_id",
        "TEXT"
      );

      await addColumnIfNotExists(
        tx,
        "tasks",
        "comments",
        "TEXT DEFAULT '[]'"
      );

      await addColumnIfNotExists(
        tx,
        "tasks",
        "notes",
        "TEXT DEFAULT ''"
      );

      await addColumnIfNotExists(
        tx,
        "assets",
        "model",
        "TEXT"
      );

      await addColumnIfNotExists(
        tx,
        "invitations",
        "updated_at",
        "TEXT"
      );

      // ------------------------------------------------------
      // Indexes
      // ------------------------------------------------------

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_users_workspace
        ON users(workspace_id)
      `);

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_sessions_token
        ON sessions(token_hash)
      `);

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_sessions_user
        ON sessions(user_id)
      `);

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_projects_workspace
        ON projects(workspace_id)
      `);

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_tasks_workspace
        ON tasks(workspace_id)
      `);

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_tasks_project
        ON tasks(project_id)
      `);

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_deals_workspace
        ON deals(workspace_id)
      `);

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_leads_workspace
        ON leads(workspace_id)
      `);

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_employees_workspace
        ON employees(workspace_id)
      `);

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_expenses_workspace
        ON expenses(workspace_id)
      `);

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_assets_workspace
        ON assets(workspace_id)
      `);

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_candidates_workspace
        ON candidates(workspace_id)
      `);

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_invitations_workspace
        ON invitations(workspace_id)
      `);

      await tx.execute(`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace
        ON audit_logs(workspace_id)
      `);

      // ------------------------------------------------------
      // Seed the default workspace only.
      // Do NOT query users here.
      // ------------------------------------------------------

      const now = new Date().toISOString();

      if (tx.isPostgres()) {
        await tx.execute(
          `
          INSERT INTO workspaces
            (id, name, slug, plan, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO NOTHING
          `,
          [
            "org-worqester-01",
            "Worqester Technologies",
            "worqester",
            "Enterprise Cloud",
            now,
            now,
          ]
        );
      } else {
        await tx.execute(
          `
          INSERT OR IGNORE INTO workspaces
            (id, name, slug, plan, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            "org-worqester-01",
            "Worqester Technologies",
            "worqester",
            "Enterprise Cloud",
            now,
            now,
          ]
        );
      }

      // ------------------------------------------------------
      // Migration marker
      // ------------------------------------------------------

      await tx.execute(
        `
        INSERT INTO schema_migrations
          (version, applied_at)
        VALUES (?, ?)
        `,
        [
          "001_normalized_relational_schema",
          now,
        ]
      );
    });
  }

  // ==========================================================
  // Migration 002
  // ==========================================================

  if (!applied.has("002_employee_user_id")) {
    console.log(
      "[Database Migration] Applying 002_employee_user_id..."
    );

    await db.transaction(async (tx) => {
      if (await tableExists(tx, "employees")) {
        await addColumnIfNotExists(
          tx,
          "employees",
          "user_id",
          "TEXT"
        );
      }

      await tx.execute(
        `
        INSERT INTO schema_migrations
          (version, applied_at)
        VALUES (?, ?)
        `,
        [
          "002_employee_user_id",
          new Date().toISOString(),
        ]
      );
    });
  }

  // ==========================================================
  // Migration 003
  // ==========================================================

  if (!applied.has("003_additional_business_fields")) {
    console.log(
      "[Database Migration] Applying 003_additional_business_fields..."
    );

    await db.transaction(async (tx) => {
      if (await tableExists(tx, "tasks")) {
        await addColumnIfNotExists(
          tx,
          "tasks",
          "comments",
          "TEXT DEFAULT '[]'"
        );

        await addColumnIfNotExists(
          tx,
          "tasks",
          "notes",
          "TEXT DEFAULT ''"
        );
      }

      if (await tableExists(tx, "projects")) {
        await addColumnIfNotExists(
          tx,
          "projects",
          "owner_name",
          "TEXT"
        );

        await addColumnIfNotExists(
          tx,
          "projects",
          "description",
          "TEXT"
        );
      }

      if (await tableExists(tx, "assets")) {
        await addColumnIfNotExists(
          tx,
          "assets",
          "model",
          "TEXT"
        );
      }

      await tx.execute(
        `
        INSERT INTO schema_migrations
          (version, applied_at)
        VALUES (?, ?)
        `,
        [
          "003_additional_business_fields",
          new Date().toISOString(),
        ]
      );
    });
  }

  console.log("[Database Migration] Database schema is ready.");
}