import { getDatabase } from "../src/server/db";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("===============================================================");
  console.log("         WORQESTER PORTABLE TENANT DATA EXPORT TOOL            ");
  console.log("===============================================================");
  console.log("  Note: This tool provides portable, credential-sanitized JSON  ");
  console.log("  tenant data exports. For full disaster recovery (indexes,     ");
  console.log("  sequences, constraints, WAL), use Render Managed PostgreSQL   ");
  console.log("  automated daily snapshots & point-in-time recovery (PITR).    ");
  console.log("===============================================================\n");

  const startTime = Date.now();
  const db = await getDatabase();
  const isPg = db.isPostgres();
  console.log(`[Export] Source Database: ${isPg ? "PostgreSQL (Production)" : "SQLite (Local/Dev)"}`);

  const tables = [
    "workspaces",
    "users",
    "projects",
    "milestones",
    "tasks",
    "deals",
    "leads",
    "employees",
    "expenses",
    "assets",
    "job_positions",
    "candidates",
    "invitations",
    "rbac_permissions",
    "audit_logs",
    "schema_migrations",
  ];

  const backupData: Record<string, any[]> = {};
  let totalRows = 0;

  for (const table of tables) {
    try {
      const rows = await db.query(`SELECT * FROM ${table}`);
      // Sanitize sensitive credentials
      const sanitized = rows.map((r: any) => {
        const copy = { ...r };
        if ("password_hash" in copy) copy.password_hash = "[REDACTED]";
        if ("salt" in copy) copy.salt = "[REDACTED]";
        return copy;
      });
      backupData[table] = sanitized;
      totalRows += sanitized.length;
      console.log(`  ✓ Dumped ${table.padEnd(20)}: ${sanitized.length} records`);
    } catch (err: any) {
      console.warn(`  ! Could not dump ${table}: ${err.message}`);
    }
  }

  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  const payload = {
    metadata: {
      generatedAt: new Date().toISOString(),
      databaseType: isPg ? "PostgreSQL" : "SQLite",
      totalTables: Object.keys(backupData).length,
      totalRecords: totalRows,
      productionBackupStrategy: isPg
        ? "Render Managed PostgreSQL automatically creates daily automated backups and retains point-in-time recovery WAL logs."
        : "Local SQLite file snapshot with JSON export.",
    },
    tables: backupData,
  };

  fs.writeFileSync(backupFile, JSON.stringify(payload, null, 2), "utf-8");
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n[Backup] SUCCESS: Exported ${totalRows} records across ${Object.keys(backupData).length} tables in ${duration}s.`);
  console.log(`[Backup] Output File: ${backupFile}`);
  console.log("\n[Backup Note for Production]");
  console.log("  In standard Render Web Service containers, external CLI utilities like 'pg_dump' are not installed.");
  console.log("  Render Managed PostgreSQL provides built-in automated daily backups and point-in-time recovery via the Render Dashboard.");
  console.log("  This script provides portable, pure-Node.js data export accessible in any container environment.");

  await db.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[Backup] FATAL: Backup failed:", err);
  process.exit(1);
});
