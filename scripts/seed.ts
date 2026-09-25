import { getDatabase } from "../src/server/db";
import { seedDatabase } from "../src/server/seed";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("===============================================================");
  console.log("             WORQESTER DATABASE SEED CLI SCRIPT                ");
  console.log("===============================================================\n");

  // Production Guard
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
    console.error("[Seed] CRITICAL ERROR: Refusing to seed database in production environment without explicit ALLOW_SEED=true environment variable.");
    console.error("[Seed] To override, set ALLOW_SEED=true in your deployment environment variables.");
    process.exit(1);
  }

  const db = await getDatabase();
  await seedDatabase(db, false);
  await db.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[Seed] FATAL: Seeding failed:", err);
  process.exit(1);
});
