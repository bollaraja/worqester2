import { getDatabase, runMigrations } from "../src/server/db";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("===============================================================");
  console.log("              WORQESTER DATABASE MIGRATION RUNNER             ");
  console.log("===============================================================\n");

  const startTime = Date.now();
  try {
    const db = await getDatabase();
    console.log(`[Migrate] Connected to database engine: ${db.isPostgres() ? "PostgreSQL (Production)" : "SQLite (Local/Dev)"}`);
    
    await runMigrations(db);
    
    const applied = await db.query<{ version: string; applied_at: string }>(
      "SELECT version, applied_at FROM schema_migrations ORDER BY applied_at ASC"
    );

    console.log("\n[Migrate] Current Applied Migrations:");
    for (const m of applied) {
      console.log(`  ✓ ${m.version} (Applied: ${m.applied_at})`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[Migrate] All migrations completed successfully in ${duration}s.`);
    await db.close();
    process.exit(0);
  } catch (err: any) {
    console.error("\n[Migrate] FATAL: Database migration failed:", err);
    process.exit(1);
  }
}

main();
