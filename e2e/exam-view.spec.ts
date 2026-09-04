import { test, expect } from "@playwright/test";
import {
  createPatient,
  createExam,
  randomNationalId,
  randomMobile,
  uniqueName,
  fa,
} from "./helpers/data";

/**
 * Examination read-only view scenarios (EX-V-*). See PLAYWRIGHT_TEST_SCENARIOS.md.
 */
test.describe("Examination view", () => {
  let patientId = "";
  let patientName = "";
  let examId = "";

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const name = uniqueName("نمایش");
    patientName = `${name.first} ${name.last}`;
    patientId = await createPatient(page, {
      first_name: name.first,
      last_name: name.last,
      national_id: randomNationalId(),
      mobile: randomMobile(),
    });
    // Partial data: only one V/A value + a diagnosis; everything else stays empty.
    await createExam(page, patientId, { vaOdSc: "6/6", diagnosis: "تشخیص نمونه نمایش" });
    // Grab the exam id from the most recent exam on the dashboard.
    await page.goto("/");
    const section = page
      .locator("h2")
      .filter({ hasText: fa("معاینه‌های اخیر") })
      .locator("..");
    const link = section.getByRole("link", { name: "مشاهده" }).first();
    await expect(link).toBeVisible();
    examId = (await link.getAttribute("href"))!.split("/").pop()!;
    await page.close();
  });

  test("EX-V-01 — the exam renders read-only with placeholders", async ({ page }) => {
    await page.goto(`/examinations/${examId}`);
    await expect(page.getByRole("heading", { name: "معاینه", exact: true })).toBeVisible();

    // Filled value is visible…
    await expect(page.getByText("6/6")).toBeVisible();
    // …and empty cells fall back to an em dash.
    await expect(page.getByText("—").first()).toBeVisible();

    await expect(page.getByText("تشخیص نمونه نمایش")).toBeVisible();
    // Notes section is only rendered when notes exist.
    await expect(page.getByText(fa("F — یادداشت / فوندوس"))).toHaveCount(0);
  });

  test("EX-V-02 — new exam shortcut navigates to the form", async ({ page }) => {
    await page.goto(`/examinations/${examId}`);
    await page
      .getByRole("link", { name: "معاینه جدید برای این بیمار", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/patients/${patientId}/examinations/new`));
  });

  test("EX-V-03 — back link returns to the patient profile", async ({ page }) => {
    await page.goto(`/examinations/${examId}`);
    await page
      .getByRole("link", { name: new RegExp(`پرونده ${patientName}`) })
      .click();
    await expect(page).toHaveURL(new RegExp(`/patients/${patientId}\\?tab=exams`));
  });

  test("EX-V-04 — unknown exam id renders 404", async ({ page }) => {
    await page.goto("/examinations/00000000-0000-4000-8000-000000000000");
    await expect(page.getByText("صفحه مورد نظر پیدا نشد")).toBeVisible();
  });
});