import { expect, type Page } from "@playwright/test";

/* ------------------------------------------------------------------ */
/* Persian text/digit helpers                                          */
/* ------------------------------------------------------------------ */

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ZWNJ = "\u200c"; // zero-width non-joiner, common in Persian orthography

/** Convert Persian digits (۰-۹) in a string to ASCII digits. */
export function faToEn(value: string): string {
  return value.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

/** Convert ASCII digits in a string/number to Persian digits. */
export function enToFa(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/**
 * Build a regex that matches a Persian UI string tolerating ZWNJ characters
 * and whitespace differences (e.g. "ثبت‌شده" vs "ثبت شده"). Use this for
 * `getByText`/`hasText` assertions against UI strings.
 */
export function fa(text: string): RegExp {
  const parts = text
    .replace(new RegExp(ZWNJ, "g"), "")
    .split("")
    .map((c) =>
      c === " " ? "\\s+" : c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
  return new RegExp(parts.join(`${ZWNJ}?`));
}

/* ------------------------------------------------------------------ */
/* Unique test data                                                    */
/* ------------------------------------------------------------------ */

let seq = Date.now() % 1_000_000_000;

/**
 * Valid Iranian national ID (10 digits, checksum per src/shared/lib/persian.ts).
 * Monotonic prefix keeps IDs unique across tests AND across repeated runs.
 */
export function randomNationalId(): string {
  seq = (seq + 1) % 1_000_000_000;
  const prefix = String(seq).padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(prefix[i]) * (10 - i);
  const r = sum % 11;
  const check = r < 2 ? r : 11 - r;
  return prefix + check;
}

/** Random Iranian mobile in the 09xxxxxxxxx form. */
export function randomMobile(): string {
  const tail = String(Math.floor(Math.random() * 10_000_000)).padStart(7, "0");
  return `0912${tail}`;
}

/** Unique full name (first_name + last_name) for search fixtures. */
export function uniqueName(prefix: string): { first: string; last: string } {
  seq += 1;
  return { first: prefix, last: `E2E${seq}` };
}

/* ------------------------------------------------------------------ */
/* File fixtures (for setInputFiles)                                   */
/* ------------------------------------------------------------------ */

export interface FakeFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

/** 1×1 transparent PNG. */
export function tinyPng(name = "test-image.png"): FakeFile {
  return {
    name,
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    ),
  };
}

/** Minimal PDF (metadata only — the app never renders PDF content). */
export function tinyPdf(name = "test-doc.pdf"): FakeFile {
  return {
    name,
    mimeType: "application/pdf",
    buffer: Buffer.from(
      "%PDF-1.4\n" +
        "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
        "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
        "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n" +
        "trailer<</Size 4/Root 1 0 R>>\n" +
        "%%EOF\n",
    ),
  };
}

/** A file of an arbitrary size (e.g. to exceed the 5/10 MB limits). */
export function bigFile(
  sizeBytes: number,
  name = "big-image.png",
  mimeType = "image/png",
): FakeFile {
  return { name, mimeType, buffer: Buffer.alloc(sizeBytes, 1) };
}

/* ------------------------------------------------------------------ */
/* Dashboard helpers                                                   */
/* ------------------------------------------------------------------ */

/** Read one stat card value on the dashboard (Persian digits → string). */
export async function statValue(page: Page, label: string): Promise<string> {
  await page.goto("/");
  const card = page.locator("section.grid > div").filter({ hasText: fa(label) });
  return (await card.locator("p.tabular-nums").textContent()) ?? "";
}

/** Total registered patients, read from the /patients heading. */
export async function patientTotal(page: Page): Promise<number> {
  await page.goto("/patients");
  const heading = page.getByText(/بیمار ثبت/).first();
  const digits = faToEn((await heading.textContent()) ?? "").match(/\d+/);
  return digits ? Number(digits[0]) : 0;
}

/* ------------------------------------------------------------------ */
/* Patient creation flow                                               */
/* ------------------------------------------------------------------ */

export interface NewPatient {
  first_name: string;
  last_name: string;
  national_id: string;
  mobile: string;
  address?: string;
  notes?: string;
}

/** Fill (but do not submit) the new/edit patient form. */
export async function fillPatientForm(page: Page, data: NewPatient): Promise<void> {
  await page.locator("#first_name").fill(data.first_name);
  await page.locator("#last_name").fill(data.last_name);
  await page.locator("#national_id").fill(data.national_id);
  await page.locator("#mobile").fill(data.mobile);
  if (data.address) await page.locator("#address").fill(data.address);
  if (data.notes) await page.locator("#notes").fill(data.notes);
}

/** Submit the patient form (create mode button). */
export async function submitPatientForm(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "ثبت بیمار", exact: true })
    .click();
}

/**
 * Full happy-path flow: open /patients/new, fill, submit, wait for the
 * redirect to the profile. Returns the created patient's id.
 */
export async function createPatient(
  page: Page,
  data: NewPatient,
): Promise<string> {
  await page.goto("/patients/new");
  await fillPatientForm(page, data);
  await submitPatientForm(page);
  await page.waitForURL(/\/patients\/[0-9a-f-]{36}$/);
  await expect(page.getByText("بیمار جدید با موفقیت ثبت شد.")).toBeVisible();
  return page.url().split("/").pop() ?? "";
}

/* ------------------------------------------------------------------ */
/* Examination creation flow                                           */
/* ------------------------------------------------------------------ */

export interface ExamValues {
  vaOdSc?: string;
  vaOdCc?: string;
  vaOsSc?: string;
  vaOsCc?: string;
  dryOdSph?: string;
  dryOdCyl?: string;
  dryOdAxis?: string;
  dryOsSph?: string;
  dryOsCyl?: string;
  dryOsAxis?: string;
  cycloOdAxis?: string;
  cycloOsAxis?: string;
  /** Custom-section cells, keyed by `${rowIndex}:${colIndex}` (0-based). */
  customCells?: Record<string, string>;
  diagnosis?: string;
  plan?: string;
  notes?: string;
}

/**
 * Locate an input inside an exam-form section by heading substring
 * (ASCII-only substrings like "V/A", "Dry", "Cyclo" avoid ZWNJ pitfalls).
 */
function sectionInput(
  page: Page,
  headingFragment: string,
  row: number, // 0 = OD/راست, 1 = OS/چپ
  col: number, // 0-based among the data columns (SC/CC → 0,1; SPH/CYL/AXIS → 0,1,2)
): ReturnType<Page["locator"]> {
  const card = page.locator("h2").filter({ hasText: headingFragment }).locator("..");
  return card
    .getByRole("table")
    .getByRole("row")
    .nth(row + 1) // skip header row
    .locator("td")
    .nth(col + 1) // first td is the eye label
    .locator("input");
}

/** Fill the exam form fields that were provided (date defaults to today). */
export async function fillExamForm(page: Page, values: ExamValues): Promise<void> {
  if (values.vaOdSc !== undefined) await sectionInput(page, "V/A", 0, 0).fill(values.vaOdSc);
  if (values.vaOdCc !== undefined) await sectionInput(page, "V/A", 0, 1).fill(values.vaOdCc);
  if (values.vaOsSc !== undefined) await sectionInput(page, "V/A", 1, 0).fill(values.vaOsSc);
  if (values.vaOsCc !== undefined) await sectionInput(page, "V/A", 1, 1).fill(values.vaOsCc);

  if (values.dryOdSph !== undefined) await sectionInput(page, "Dry", 0, 0).fill(values.dryOdSph);
  if (values.dryOdCyl !== undefined) await sectionInput(page, "Dry", 0, 1).fill(values.dryOdCyl);
  if (values.dryOdAxis !== undefined) await sectionInput(page, "Dry", 0, 2).fill(values.dryOdAxis);
  if (values.dryOsSph !== undefined) await sectionInput(page, "Dry", 1, 0).fill(values.dryOsSph);
  if (values.dryOsCyl !== undefined) await sectionInput(page, "Dry", 1, 1).fill(values.dryOsCyl);
  if (values.dryOsAxis !== undefined) await sectionInput(page, "Dry", 1, 2).fill(values.dryOsAxis);

  if (values.cycloOdAxis !== undefined) await sectionInput(page, "Cyclo", 0, 2).fill(values.cycloOdAxis);
  if (values.cycloOsAxis !== undefined) await sectionInput(page, "Cyclo", 1, 2).fill(values.cycloOsAxis);

  // First custom section (configurable via settings) sits after the Cyclo card.
  const custom = page.locator("form > div").nth(4).getByRole("table");
  for (const [key, value] of Object.entries(values.customCells ?? {})) {
    const [r, c] = key.split(":").map(Number);
    await custom
      .getByRole("row")
      .nth(r + 1)
      .locator("td")
      .nth(c + 1)
      .locator("input")
      .fill(value);
  }

  if (values.notes !== undefined) await page.locator("#exam_notes").fill(values.notes);
  if (values.diagnosis !== undefined) await page.locator("#exam_diagnosis").fill(values.diagnosis);
  if (values.plan !== undefined) await page.locator("#exam_plan").fill(values.plan);
}

/**
 * Full happy-path flow: create an examination for a patient through the UI.
 * Assumes a fresh page and stays on the redirected profile (exams tab).
 */
export async function createExam(
  page: Page,
  patientId: string,
  values: ExamValues = {},
): Promise<void> {
  await page.goto(`/patients/${patientId}/examinations/new`);
  await fillExamForm(page, values);
  await page.getByRole("button", { name: "ثبت معاینه", exact: true }).click();
  await page.waitForURL(new RegExp(`/patients/${patientId}\\?tab=exams`));
  await expect(page.getByText("معاینه با موفقیت ثبت شد.")).toBeVisible();
}