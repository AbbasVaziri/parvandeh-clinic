# Playwright Test Scenarios — سامانه پرونده بیماران (Clinic Patient Records)

This document defines the end-to-end test scenarios for the clinic patient-records
web app, ready to be implemented as Playwright tests. Each scenario lists the
preconditions, the steps, and the expected result, including the exact Persian
UI strings to assert against.

- **App**: سامانه پرونده بیماران — an ophthalmic clinic patient-records panel
- **Stack**: Next.js 16 (App Router, RSC + Server Actions), Supabase (Postgres + Auth + Storage), shadcn/ui, react-hook-form + zod, sonner toasts
- **Locale**: RTL Persian UI; numbers displayed as Persian digits (۰۱۲۳۴۵۶۷۸۹) unless inside `dir="ltr"` inputs
- **Routes**: `/login`, `/` (dashboard), `/patients`, `/patients/new`, `/patients/[id]`, `/patients/[id]/edit`, `/patients/[id]/examinations/new`, `/examinations/[id]`, `/settings`

---

## 1. Prerequisites & Test Environment

| Item | Value / Note |
|---|---|
| Base URL | `http://localhost:3000` (start with `npm run dev` or `npm run build && npm start`) |
| Reception account | `reception@clinic.local` / `Reception@1234` (from `npm run seed`) |
| Doctor account | `doctor@clinic.local` / `Doctor@1234` (from `npm run seed`) |
| DB setup | `npm run db:migrate` or run `supabase/migrations/0001_init.sql` in the Supabase SQL Editor |
| Bulk test data | `node scripts/generate-fake-data.mjs [count]` → produces `supabase/seed/fake-patients.sql` (deterministic, seeded RNG) — use it to test search + pagination at scale |
| RLS | Both staff users (`authenticated`) have full read/write access to all tables — no role-based UI differences exist in the MVP |

### Recommended Playwright setup

- **Shared auth state**: sign in once and reuse via `storageState` in
  `playwright.config.ts` so the majority of specs skip the login flow.
- **Isolation**: create patients/exams/documents through the UI in `beforeEach`
  and clean up via Supabase (service role) in `afterEach`, or scope data to a
  unique name/national-id per run to avoid duplicate-key failures.
- **Unique national ID helper**: Iranian national IDs have a 10-digit checksum
  (`src/shared/lib/persian.ts` → `isValidNationalId`). A valid fixture example:
  `0451727304`. Generate fresh valid IDs in a helper rather than hard-coding one.
- **Toast assertions**: sonner toasts render with `role="status"`; assert on
  text (`page.getByText('...')`) and `await expect(...).toBeVisible()`.
- **Server-action navigation**: after submit, `router.push`/`redirect` happens
  server-side — use `await page.waitForURL(...)` instead of immediate assertions.
- **Persian digits**: counts/dates render as Persian digits (`toPersianDigits`),
  e.g. `۱۲۳`. Compare with normalized values in assertions.
- **Date picker**: `react-multi-date-picker` with the Persian calendar; the
  input is `readOnly` and opens a popup on focus/click (`calendarPosition="bottom-right"`).
  Tests may rely on the default (today) date and avoid popup interaction.

---

## 2. Scenario Catalog

Scenario IDs follow the convention `AREA-NN`:

| Prefix | Area |
|---|---|
| `DASH` | Dashboard |
| `LIST` | Patients list + search + pagination |
| `PAT-C` | Patient creation (form validation) |
| `PAT-E` | Patient edit |
| `PAT-P` | Patient profile + tabs |
| `EX-C` | Examination creation |
| `EX-V` | Examination read-only view |
| `DOC` | Patient documents (upload / delete) |
| `SET` | Settings |
| `UI` | Global UI behavior |

---

### 2.1 Dashboard (`DASH`)

*Requires signed-in session; dashboard shows live counts — use seeded data or an isolated DB.*

#### DASH-01 — Stat cards show correct counts
**Steps:** Create 1 patient and 2 exams for it via UI, then open `/`.
**Expected:** «بیماران» card shows `۱` and «معاینهها» shows `۲` (Persian digits).

#### DASH-02 — Hero search by first/last name
**Steps:** In the hero search box type ≥ 2 characters of an existing patient's name.
**Expected:** Result list shows the patient row (name, کد ملی, موبایل,
آخرین معاینه or «بدون معاینه») with a «مشاهده پرونده» button linking to the profile.

#### DASH-03 — Hero search by national ID or mobile
**Steps:** Type an existing patient's national ID (or mobile).
**Expected:** The matching patient appears in results. (Query is
digit-normalized, so Persian-digit input must also match.)

#### DASH-04 — Hero search with no matches
**Steps:** Type a string that matches nothing.
**Expected:** «بیماری یافت نشد» block with «عبارت دیگری را امتحان کنید یا بیمار
جدید ثبت کنید.» and a «ثبت بیمار جدید» button that opens `/patients/new`.

#### DASH-05 — Hero search below 2 characters shows no results
**Steps:** Type a single character, then clear.
**Expected:** No results list and no «یافت نشد» state is rendered.

#### DASH-06 — Recent patients list
**Steps:** With ≥ 1 patient, open `/`.
**Expected:** «بیماران اخیر» shows up to 5 rows; each «پرونده» button navigates
to `/patients/[id]`.

#### DASH-07 — Recent exams list
**Steps:** With ≥ 1 exam, open `/`.
**Expected:** «معاینههای اخیر» shows up to 5 rows with patient name and Persian
date; «مشاهده» navigates to `/examinations/[id]`.

#### DASH-08 — Empty-state links
**Steps:** With an empty DB, open `/`.
**Expected:** «بیماران اخیر» shows «هنوز بیماری ثبت نشده است» + «ثبت بیمار
جدید» action; «معاینههای اخیر» shows «هنوز معاینه‌ای ثبت نشده است».

#### DASH-09 — Quick actions
**Steps:** Click «بیمار جدید» (hero) and «همه بیماران».
**Expected:** Respectively navigates to `/patients/new` and `/patients`.

---

### 2.2 Patients list (`LIST`)

*Requires ≥ 21 patients (e.g., from `generate-fake-data.mjs`) to exercise pagination.*

#### LIST-01 — Table renders columns
**Steps:** Open `/patients`.
**Expected:** Header shows «X بیمار ثبت‌شده» (Persian digits) and a table with
columns نام و نام خانوادگی، کد ملی، موبایل، آخرین معاینه and a پرونده action per row.

#### LIST-02 — Empty state
**Steps:** With an empty DB, open `/patients`.
**Expected:** «هنوز بیماری ثبت نشده است» + «اولین پرونده را با دکمه «بیمار جدید» بسازید.» + «ثبت بیمار جدید» button.

#### LIST-03 — Search by name / ID / mobile
**Steps:** Type a query into the search box and submit the form (`GET /patients?q=...`).
**Expected:** Table filters to matches; «بیماری یافت نشد» appears when nothing matches.

#### LIST-04 — Search query survives pagination
**Steps:** Search a term with > 1 page of results, click «بعدی».
**Expected:** URL contains both `q` and `page`; results remain filtered.

#### LIST-05 — Pagination controls
**Steps:** On page 1 of a multi-page list, click «بعدی» then «قبلی».
**Expected:** URL `page` param changes; «صفحه ۱ از N» text updates; «قبلی» is
disabled on page 1 and «بعدی» is disabled on the last page.

#### LIST-06 — Navigate to profile
**Steps:** Click a row's «پرونده» button.
**Expected:** Lands on `/patients/[id]` with the patient's name as page title.

---

### 2.3 Patient creation (`PAT-C`)

*Note: the national ID is optional in the form (empty is allowed; when
filled in it must still be 10 digits with a valid checksum).*

#### PAT-C-01 — Create a valid patient
**Steps:** `/patients/new` → fill نام، نام خانوادگی، a valid کد ملی، a valid
موبایل (`09123456789`) → «ثبت بیمار».
**Expected:** Toast «بیمار جدید با موفقیت ثبت شد.» → redirected to
`/patients/[id]`; header shows full name; national ID and mobile badges visible.

#### PAT-C-02 — Required first/last name
**Steps:** Submit with empty نام and نام خانوادگی.
**Expected:** Inline errors «نام الزامی است» and «نام خانوادگی الزامی است»
below the fields; no navigation.

#### PAT-C-03 — National ID length
**Steps:** Enter a 9-digit ID.
**Expected:** «کد ملی باید ۱۰ رقم باشد».

#### PAT-C-04 — National ID checksum
**Steps:** Enter 10 digits with a wrong checksum (e.g., `1234567890`).
**Expected:** «کد ملی وارد شده معتبر نیست».

#### PAT-C-05 — Invalid mobile
**Steps:** Enter e.g. `0912` or `02112345678`.
**Expected:** «شماره موبایل معتبر نیست (نمونه: ۰۹۱۲۳۴۵۶۷۸۹)».

#### PAT-C-06 — Mobile normalization
**Steps:** Try each input: `۰۹۱۲۳۴۵۶۷۸۹` (Persian digits), `00989123456789`,
`989123456789`, `9123456789` (10 digits starting with 9).
**Expected:** All are accepted; the profile shows the normalized `09123456789`.

#### PAT-C-07 — Duplicate national ID
**Steps:** Create patient A, then create patient B with the same national ID.
**Expected:** Toast «بیماری با این کد ملی قبلاً ثبت شده است.»; stays on the form.

#### PAT-C-08 — Avatar upload (valid image)
**Steps:** Click «انتخاب عکس» and choose a small PNG/JPG/WebP.
**Expected:** Avatar preview appears; after save, the profile header shows the image.

#### PAT-C-09 — Avatar rejects non-image
**Steps:** Choose a `.txt` file.
**Expected:** Toast «عکس پروفایل باید یک تصویر باشد.»; no preview.

#### PAT-C-10 — Avatar size limit
**Steps:** Choose an image larger than 5 MB.
**Expected:** Toast «حجم عکس حداکثر ۵ مگابایت است.».

#### PAT-C-11 — Birth date via Persian picker
**Steps:** Open the «تاریخ تولد» picker and select a date.
**Expected:** Input shows the Persian date; after save the profile «تاریخ تولد»
matches (converted via `faDate`).

#### PAT-C-12 — Optional fields
**Steps:** Fill آدرس and توضیحات with leading/trailing whitespace.
**Expected:** Saved with trimmed values; profile shows both; empty optional
fields render as «—».

#### PAT-C-13 — Cancel
**Steps:** Click «انصراف» on `/patients/new`.
**Expected:** Back to `/patients`; no patient created.

#### PAT-C-14 — National ID is optional
**Steps:** Register a patient leaving کد ملی empty.
**Expected:** Patient is created successfully; the profile and the patients
list render «—» for the national ID; searching by that patient's name still
works.

---

### 2.4 Patient edit (`PAT-E`)

#### PAT-E-01 — Form is pre-filled
**Steps:** Open `/patients/[id]/edit`.
**Expected:** نام، نام خانوادگی، کد ملی، موبایل, address/notes reflect current values; heading shows the patient's name.

#### PAT-E-02 — Update fields
**Steps:** Change موبایل and توضیحات → «ذخیره تغییرات».
**Expected:** Toast «اطلاعات بیمار به‌روزرسانی شد.» → redirected to the profile
with updated values.

#### PAT-E-03 — National ID collision on edit
**Steps:** With two patients A and B, edit A and set A's national ID to B's.
**Expected:** Toast «بیمار دیگری با این کد ملی ثبت شده است.»; stays on form;
A unchanged.

#### PAT-E-04 — Cancel
**Steps:** Click «انصراف».
**Expected:** Back to `/patients/[id]`.

---

### 2.5 Patient profile (`PAT-P`)

#### PAT-P-01 — Info tab
**Steps:** Open `/patients/[id]` (default tab).
**Expected:** All fields shown: full name, national ID, mobile, birth date,
address, notes, «ثبت / آخرین ویرایش» timestamps.

#### PAT-P-02 — Tab switching
**Steps:** Click «معاینه‌ها» and «مدارک» tabs.
**Expected:** Content switches; URL gains `?tab=exams` / `?tab=docs` when applicable.

#### PAT-P-03 — Exams tab empty state
**Steps:** Open a patient with no exams → «معاینه‌ها» tab.
**Expected:** «هنوز معاینه‌ای ثبت نشده است» + «ثبت معاینه جدید» button.

#### PAT-P-04 — Exams tab with data
**Steps:** Open a patient with 2 exams.
**Expected:** Exams listed newest-first with Persian date badges («معاینه ۲» …
«معاینه ۱») and full CC, V/A, Dry, Cyclo tables, diagnosis/plan/custom sections.

#### PAT-P-05 — Docs tab empty state
**Steps:** Open a patient with no documents → «مدارک» tab.
**Expected:** «هنوز مدرکی افزوده نشده است» + «افزودن مدرک / تصویر» button.

#### PAT-P-06 — Unknown patient id
**Steps:** Visit `/patients/<random-uuid>`.
**Expected:** 404 not-found page.

#### PAT-P-07 — Action buttons
**Steps:** Click «ثبت معاینه جدید» and «ویرایش».
**Expected:** Navigate to `/patients/[id]/examinations/new` and `/patients/[id]/edit`.

---

### 2.6 Examination creation (`EX-C`)

*Note: the form collects the date only — the former «ساعت» (time) field was
removed and stored exams are date-only (local midnight). Exams can be edited
at any time (no same-day restriction).*

#### EX-C-01 — Save a minimal exam
**Steps:** `/patients/[id]/examinations/new` → leave date at today's default, fill
V/A SC `6/6`, Dry OD SPH `-1.25` → «ثبت معاینه».
**Expected:** Toast «معاینه با موفقیت ثبت شد.» → redirected to
`/patients/[id]?tab=exams`; new exam card visible.

#### EX-C-02 — AXIS out of range
**Steps:** Set Dry OD AXIS to `181`.
**Expected:** Toast «محور (AXIS) باید بین ۰ تا ۱۸۰ باشد.»; not saved.
Repeat with AXIS `-1` → same error.

#### EX-C-03 — AXIS boundary values
**Steps:** Set AXIS to `0` and `180`.
**Expected:** Both saved successfully (no validation error).

#### EX-C-04 — Persian-digit numeric input
**Steps:** Enter SPH as `۰۵/۱-` (Persian digits) and AXIS as `۹۰`.
**Expected:** Values normalized and persisted; exam view shows `-1.5` / `90`.

#### EX-C-05 — An exam can be edited
**Steps:** From the patient profile exams tab, click «ویرایش» on any exam →
change the diagnosis → «ذخیره تغییرات».
**Expected:** Edit page is pre-filled with the saved values; toast
«معاینه با موفقیت ویرایش شد.» → redirected to `/patients/[id]?tab=exams` with
the updated values on the exam card.

#### EX-C-05b — Editing works for older exams too
**Steps:** Open the edit URL of an exam dated in the past.
**Expected:** The pre-filled edit form loads normally; saving updates the exam.

#### EX-C-06 — Custom section cells
**Steps:** Fill a cell in «جدول تکمیلی (قابل تنظیم)» and save.
**Expected:** Cell value appears in the profile exam card and on `/examinations/[id]`.

#### EX-C-07 — Diagnosis / plan / notes
**Steps:** Fill «F — یادداشت / فوندوس», «تشخیص», «پلن» and save.
**Expected:** All three rendered in the exam view (notes labelled
«F — یادداشت / فوندوس»).

#### EX-C-08 — Exam appears in recent list
**Steps:** After saving, open `/`.
**Expected:** The exam appears under «معاینه‌های اخیر» with the patient name.

#### EX-C-09 — Cancel
**Steps:** Click «انصراف» on the exam form.
**Expected:** Back to `/patients/[id]`; no exam created.

#### EX-C-10 — CC field (2nd position)
**Steps:** On `/patients/[id]/examinations/new`, the «CC» box appears right after
the date card; fill the CC input and save.
**Expected:** Value persists — shown in the exam view and on the patient profile
exam card. Editing pre-fills the saved CC value.

---

### 2.7 Examination view (`EX-V`)

#### EX-V-01 — Read-only rendering
**Steps:** Open `/examinations/[id]` for an exam with partial data.
**Expected:** CC value + V/A, Dry, Cyclo tables render with `—` for empty cells; diagnosis /
plan / custom sections / notes render only when present; «معاینه» title + Persian
date badge.

#### EX-V-02 — New exam shortcut
**Steps:** Click «معاینه جدید برای این بیمار».
**Expected:** Navigates to `/patients/[id]/examinations/new`.

#### EX-V-03 — Back link
**Steps:** Click «پرونده <نام بیمار>».
**Expected:** Back to `/patients/[id]?tab=exams`.

#### EX-V-04 — Unknown exam id
**Steps:** Visit `/examinations/<random-uuid>`.
**Expected:** 404 not-found page.

---

### 2.8 Documents (`DOC`)

*File fixtures: a small PNG (e.g. 1×1 px) and a small PDF. `setInputFiles` in
Playwright works with the hidden `<input type="file">` used by the dialog.*

#### DOC-01 — Upload an image
**Steps:** Profile → «مدارک» tab → «افزودن مدرک / تصویر» → «انتخاب فایل» → choose
PNG → «افزودن».
**Expected:** Toast «مدرک با موفقیت افزوده شد.»; dialog closes; a card with the
image thumbnail, auto-filled title (filename without extension) and size in
Persian units appears; «مشاهده» opens the file.

#### DOC-02 — Upload a PDF
**Steps:** Same flow with a PDF.
**Expected:** Card shows the file icon (no thumbnail) + «مشاهده» link.

#### DOC-03 — Missing title
**Steps:** Clear the auto-filled title → «افزودن».
**Expected:** Toast «عنوان مدرک را وارد کنید.»; nothing uploaded.

#### DOC-04 — Unsupported file type
**Steps:** Choose a `.txt` file.
**Expected:** Toast «فقط تصویر یا فایل PDF پذیرفته می‌شود.»; file not attached.

#### DOC-05 — File over 10 MB
**Steps:** Choose an image larger than 10 MB.
**Expected:** Toast «حجم فایل حداکثر ۱۰ مگابایت است.`.

#### DOC-06 — Delete with confirmation
**Steps:** Hover a document card → click the trash icon (aria-label «حذف مدرک») →
confirm «حذف» in the dialog.
**Expected:** Toast «مدرک حذف شد.»; card removed from the list.

#### DOC-07 — Cancel deletion
**Steps:** Open the delete dialog → «انصراف».
**Expected:** Document remains; dialog closes.

#### DOC-08 — Description shown on card
**Steps:** Upload with a توضیح.
**Expected:** Description text (clamped to 2 lines) appears on the card.

---

### 2.9 Settings (`SET`)

#### SET-01 — Change clinic name
**Steps:** `/settings` → change «نام کلینیک» → «ذخیره تنظیمات».
**Expected:** Toast «تنظیمات ذخیره شد.»; topbar/sidebar show the new name after
the refresh.

#### SET-02 — Add a custom table
**Steps:** Click «جدول جدید» → set عنوان/ردیف‌ها/ستون‌ها → save.
**Expected:** The table appears in the exam form
(`/patients/[id]/examinations/new`) with the configured label, rows and columns.

#### SET-03 — Edit rows/columns (comma-separated)
**Steps:** Change ردیف‌ها and ستون‌ها using commas (Persian `،` or ASCII `,`) → save.
**Expected:** Exam form reflects the new grid; empty tokens are dropped.

#### SET-04 — Delete a custom table
**Steps:** Click the table's trash icon (aria-label «حذف جدول») → save.
**Expected:** Table gone from settings; exam form no longer renders it.

#### SET-05 — Empty clinic name falls back to default
**Steps:** Clear the name → save.
**Expected:** Saved value falls back to «کلینیک چشم‌پزشکی» (see
`updateClinicSettings`).

#### SET-06 — Account card
**Steps:** Open `/settings`.
**Expected:** Card shows the signed-in email and role label («پذیرش» or «پزشک»).

---

### 2.10 Global UI (`UI`)

#### UI-01 — Theme toggle
**Steps:** Click the theme button (aria-label «تغییر تم») in the topbar.
**Expected:** App toggles dark/light (`dark` class on `<html>`); preference
persists on reload.

#### UI-02 — RTL layout
**Steps:** Any authenticated page.
**Expected:** `<html dir="rtl">`; nav/table text aligned right; `dir="ltr"`
inputs (mobile, national ID) left-aligned.

#### UI-03 — Mobile navigation
**Steps:** Set viewport to a mobile size (e.g. 390×844).
**Expected:** Sidebar hidden; bottom nav with داشبورد / بیماران / تنظیمات visible
and functional.

#### UI-04 — Persian number formatting
**Steps:** Compare stat cards, pagination («صفحه ۱ از N»), dates and file sizes
against DB values.
**Expected:** All rendered as Persian digits.

#### UI-05 — Error boundary
**Steps:** (Optional, controlled) Force a server error on an app route.
**Expected:** The app error page (with a retry action) renders instead of a blank
screen (see `src/app/(app)/error.tsx`).

---

## 3. Suggested Test File Layout

```
e2e/
  helpers/
    auth.ts          # signIn() + storageState reuse
    data.ts          # valid nationalId() generator, unique fixtures, cleanup
  dashboard.spec.ts  # DASH-*
  patients-list.spec.ts    # LIST-*
  patient-create.spec.ts   # PAT-C-*
  patient-edit.spec.ts     # PAT-E-*
  patient-profile.spec.ts  # PAT-P-*
  exam-create.spec.ts      # EX-C-*
  exam-view.spec.ts        # EX-V-*
  documents.spec.ts        # DOC-* (fixtures: tiny.png, tiny.pdf)
  settings.spec.ts         # SET-*
  ui.spec.ts               # UI-*
```

**Authentication is handled by infrastructure, not by test files:**
`e2e/global-setup.ts` signs in with the reception account once and saves a
Playwright `storageState` that every spec reuses (see
`playwright.config.ts`). Both staff roles share full data access, so one
session is sufficient. If the seeded accounts are missing, run `npm run seed`
first.

---

## 4. Known Pitfalls / Notes

1. **National ID uniqueness**: `patients.national_id` is `unique` — always
   generate a fresh valid ID per test run (use the checksum algorithm).
2. **Server actions + navigation**: wait for the URL change (`waitForURL`)
   after saving; toasts and redirects are asynchronous.
3. **Debounced hero search**: the dashboard search fires 300 ms after typing
   ≥ 2 chars — `expect(...).toBeVisible()` auto-waits, so prefer it over
   `sleep`.
4. **Hidden file inputs**: use `locator('input[type="file"]').setInputFiles(...)`;
   both avatar and document inputs are visually hidden.
5. **Date picker**: prefers defaulting to today; if a specific date is needed,
   drive the popup calendar by its Persian weekday/month labels
   (`react-multi-date-picker` locale `persian_fa`).
6. **`faDate` output**: dates render in Persian calendar text; assert against
   values produced by `src/shared/lib/jalali.ts` rather than Gregorian strings.