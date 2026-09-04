import { test, expect } from "@playwright/test";
import {
  createPatient,
  createExam,
  fillExamForm,
  randomNationalId,
  randomMobile,
  uniqueName,
  fa,
} from "./helpers/data";

/**
 * Examination creation scenarios (EX-C-*). See PLAYWRIGHT_TEST_SCENARIOS.md.
 */
test.describe("Examination creation", () => {
  let patientId = "";

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const name = uniqueName("معاینه");
    patientId = await createPatient(page, {
      first_name: name.first,
      last_name: name.last,
      national_id: randomNationalId(),
      mobile: randomMobile(),
    });
    await page.close();
  });

  test("EX-C-01 — a minimal exam is saved and shown on the profile", async ({ page }) => {
    await createExam(page, patientId, { vaOdSc: "6/6", dryOdSph: "-1.25" });
    await expect(page.getByText("6/6")).toBeVisible();
    await expect(page.getByText("-1.25")).toBeVisible();
  });

  test("EX-C-05 — an exam can be edited from the profile", async ({ page }) => {
    await createExam(page, patientId, { diagnosis: "تشخیص اولیه" });

    const editLink = page
      .locator('a[href*="/examinations/"][href$="/edit"]')
      .first();
    await expect(editLink).toBeVisible();
    await editLink.click();

    await expect(page).toHaveURL(/\/examinations\/[0-9a-f-]{36}\/edit$/);
    await expect(
      page.getByRole("heading", { name: "ویرایش معاینه" }),
    ).toBeVisible();

    // The form is pre-filled with the saved values.
    await expect(page.locator("#exam_diagnosis")).toHaveValue("تشخیص اولیه");

    await page.locator("#exam_diagnosis").fill("تشخیص ویرایش‌شده");
    await page
      .getByRole("button", { name: "ذخیره تغییرات", exact: true })
      .click();
    await page.waitForURL(new RegExp(`/patients/${patientId}\\?tab=exams`));
    await expect(page.getByText(fa("معاینه با موفقیت ویرایش شد."))).toBeVisible();
    await expect(page.getByText("تشخیص ویرایش‌شده")).toBeVisible();
  });

  test("EX-C-02 — AXIS out of range is rejected", async ({ page }) => {
    await page.goto(`/patients/${patientId}/examinations/new`);
    await fillExamForm(page, { dryOdAxis: "181" });
    await page.getByRole("button", { name: "ثبت معاینه", exact: true }).click();
    await expect(page.getByText(fa("محور (AXIS) باید بین ۰ تا ۱۸۰ باشد."))).toBeVisible();
    await expect(page).toHaveURL(/examinations\/new$/);

    // Negative axis hits the same rule.
    await fillExamForm(page, { dryOsAxis: "-1" });
    await page.getByRole("button", { name: "ثبت معاینه", exact: true }).click();
    await expect(page.getByText(fa("محور (AXIS) باید بین ۰ تا ۱۸۰ باشد."))).toBeVisible();
    await expect(page).toHaveURL(/examinations\/new$/);
  });

  test("EX-C-03 — AXIS boundary values 0 and 180 are accepted", async ({ page }) => {
    await createExam(page, patientId, { dryOdAxis: "0", dryOsAxis: "180" });
    await expect(page.getByText("0", { exact: true })).toBeVisible();
    await expect(page.getByText("180", { exact: true })).toBeVisible();
  });

  test("EX-C-04 — Persian-digit input is normalized", async ({ page }) => {
    await createExam(page, patientId, { dryOdSph: "-۱.۲۵", dryOdAxis: "۹۰" });
    await expect(page.getByText("-1.25")).toBeVisible();
    await expect(page.getByText("90", { exact: true })).toBeVisible();
  });

  test("EX-C-06 — custom section cells are persisted", async ({ page }) => {
    await createExam(page, patientId, { customCells: { "0:0": "مقدار سفارشی" } });
    await expect(page.getByText("مقدار سفارشی")).toBeVisible();
  });

  test("EX-C-07 — notes, diagnosis and plan are saved", async ({ page }) => {
    await createExam(page, patientId, {
      notes: "یادداشت فوندوس",
      diagnosis: "تشخیص نزدیک‌بینی",
      plan: "عینک مطالعه تجویز شد",
    });
    await expect(page.getByText("تشخیص نزدیک‌بینی")).toBeVisible();
    await expect(page.getByText("عینک مطالعه تجویز شد")).toBeVisible();
    await expect(page.getByText("یادداشت فوندوس")).toBeVisible();
  });

  test("EX-C-09 — cancel returns to the patient profile", async ({ page }) => {
    await page.goto(`/patients/${patientId}/examinations/new`);
    await page.getByRole("link", { name: "انصراف", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/patients/${patientId}$`));
  });
});