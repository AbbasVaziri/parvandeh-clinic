/**
 * Seeds the two staff accounts for the clinic panel.
 * Usage:  npm run seed   (reads .env.local / environment variables)
 * Requires: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
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

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Fill .env.local first."
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

for (const u of USERS) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { full_name: u.full_name, role_label: u.role_label },
  });

  if (error) {
    if (/already|registered/i.test(error.message)) {
      console.log(`• ${u.email} already exists — skipped`);
    } else {
      console.error(`✕ ${u.email}:`, error.message);
    }
    continue;
  }

  // Ensure the profile row exists even if the DB trigger has not run yet.
  if (data?.user) {
    await admin.from("profiles").upsert({
      id: data.user.id,
      full_name: u.full_name,
      role_label: u.role_label,
    });
  }
  console.log(`✓ created ${u.email}`);
}

console.log("\nSeeding done. Login with these accounts in the app.");
