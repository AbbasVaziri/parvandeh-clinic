/**
 * Seeds the two staff accounts for the clinic panel.
 * Usage:  npm run seed   (reads .env.local / environment variables)
 * Requires: DATABASE_URL
 */
import pg from "pg";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";

// Load .env.local manually so `node scripts/seed-users.mjs` works without dotenv.
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* .env.local optional if env vars are set externally */
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL. Fill .env.local first.");
  process.exit(1);
}

const useSsl = process.env.DATABASE_SSL === "true";
const client = new pg.Client({ connectionString, ssl: useSsl ? { rejectUnauthorized: false } : false });

const USERS = [
  {
    email: "reception@clinic.local",
    password: process.env.SEED_RECEPTION_PASSWORD || "Reception@1234",
    full_name: "پذیرش کلینیک",
    role_label: "پذیرش",
  },
  {
    email: "doctor@clinic.local",
    password: process.env.SEED_DOCTOR_PASSWORD || "Doctor@1234",
    full_name: "پزشک کلینیک",
    role_label: "پزشک",
  },
];

try {
  await client.connect();

  for (const u of USERS) {
    const { rows } = await client.query(
      "select id from public.users where lower(email) = lower($1)",
      [u.email]
    );

    let userId = rows[0]?.id;

    if (userId) {
      console.log(`• ${u.email} already exists — skipped`);
    } else {
      const passwordHash = bcrypt.hashSync(u.password, 10);
      const { rows: inserted } = await client.query(
        `insert into public.users (email, password_hash)
         values ($1, $2)
         returning id`,
        [u.email, passwordHash]
      );
      userId = inserted[0].id;
      await client.query(
        `insert into public.profiles (id, full_name, role_label)
         values ($1, $2, $3)
         on conflict (id) do nothing`,
        [userId, u.full_name, u.role_label]
      );
      console.log(`✓ created ${u.email}`);
    }
  }

  console.log("\nSeeding done. Login with these accounts in the app.");
} catch (err) {
  console.error("✕ Seeding failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
