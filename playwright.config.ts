import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for the clinic patient-records app.
 *
 * Before running (see AGENTS.md → "Playwright E2E tests"):
 *   1. npm install                 (includes @playwright/test)
 *   2. npx playwright install chromium
 *   3. Configure .env.local with a reachable Supabase project
 *   4. npm run db:migrate  &&  npm run seed   (tables + staff accounts)
 *   5. npm run test:e2e
 *
 * Authentication is handled by e2e/global-setup.ts: it signs in with the
 * reception account once and saves e2e/.auth/reception.json, which every
 * spec reuses via `storageState`.
 */

const PORT = process.env.PORT ?? "3000";
const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",

  timeout: 60_000,
  expect: { timeout: 10_000 },

  // Tests share one database and one signed-in session; run them serially so
  // data mutations (counts, search results, settings) can't interfere.
  fullyParallel: false,
  workers: 1,

  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],

  use: {
    baseURL: BASE_URL,
    storageState: "e2e/.auth/reception.json",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});