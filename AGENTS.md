<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Playwright E2E tests (سامانه پرونده بیماران)

End-to-end Playwright tests live in `e2e/`. The scenario catalog they implement
is documented in `PLAYWRIGHT_TEST_SCENARIOS.md` (at the repo root).

### First-time setup

1. `npm install` (includes `@playwright/test`)
2. `npx playwright install chromium` — downloads the browser once per machine
3. Configure a reachable PostgreSQL database in `.env.local` (`DATABASE_URL`,
   `AUTH_SECRET`)
4. `npm run db:migrate` then `npm run seed` — creates the schema and the two
   staff accounts (`reception@clinic.local`, `doctor@clinic.local`)

### Running the tests

```bash
npm run test:e2e                    # full suite (starts the dev server itself)
npm run test:e2e -- --grep "PAT-C"  # only matching tests
npm run test:e2e -- e2e/patient-create.spec.ts   # one file
npm run test:e2e -- --headed        # watch it run in a visible browser
npm run test:e2e -- --ui            # interactive UI mode
npm run test:e2e:install            # (re)install the Chromium browser
```

`playwright.config.ts` auto-starts `npm run dev` via `webServer` and reuses an
already-running server, so you can also just run tests against a server you
started yourself. Override the target with `PLAYWRIGHT_BASE_URL`.

### How the suite is wired

- **Auth is infrastructure, not a test**: `e2e/global-setup.ts` signs in as
  `reception@clinic.local` once and saves the session to `e2e/.auth/reception.json`;
  every spec reuses it via `storageState` in `playwright.config.ts`. Override
  credentials with `E2E_EMAIL` / `E2E_PASSWORD`.
- **Self-contained data**: specs create their own patients/exams/documents
  through the UI using unique fixtures from `e2e/helpers/data.ts`
  (`randomNationalId()` emits valid checksummed IDs, so re-runs never hit the
  `national_id` unique constraint). No external seeding or teardown required.
- **Serial by design**: `workers: 1` — tests share one database and one session,
  so parallelizing would make counts/search results flaky.
- **Persian UI strings**: always assert UI text with the `fa()` helper from
  `e2e/helpers/data.ts`. Persian orthography uses invisible ZWNJ characters
  (e.g. «ثبت‌شده»), which break plain-string matching — `fa()` builds a
  ZWNJ-tolerant regex.

### Common failure modes

- **Global setup can't log in** → the DB has no seeded accounts; run `npm run seed`.
- **Pagination tests skip** → they need ≥ 21 patients; generate bulk data with
  `node scripts/generate-fake-data.mjs` and run the resulting
  `migrations/seed/fake-patients.sql` (created as `supabase/seed/fake-patients.sql`).
- **Selectors drift** after UI changes — update both the spec and the scenario
  in `PLAYWRIGHT_TEST_SCENARIOS.md` so the docs stay the single source of truth.
