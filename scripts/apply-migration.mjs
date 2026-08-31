/**
 * Applies supabase/migrations/0001_init.sql via a direct Postgres connection.
 * Usage:  node scripts/apply-migration.mjs   (requires DATABASE_URL in .env.local)
 * If you don't have DATABASE_URL, paste the SQL file into Supabase → SQL Editor.
 */
import pg from "pg";
import { readFileSync } from "node:fs";

try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* optional */
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "DATABASE_URL is not set. Either add it to .env.local or run the SQL manually:\n" +
      "  Supabase Dashboard → SQL Editor → paste supabase/migrations/0001_init.sql → Run"
  );
  process.exit(1);
}

const sql = readFileSync("supabase/migrations/0001_init.sql", "utf8");
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("✓ Migration applied successfully.");
} catch (err) {
  console.error("✕ Migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
