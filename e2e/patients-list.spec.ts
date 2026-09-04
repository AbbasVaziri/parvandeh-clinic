import { test, expect } from "@playwright/test";
import {
  createPatient,
  randomNationalId,
  randomMobile,
  uniqueName,
  patientTotal,
  fa,
} from "./helpers/data";

/**
 * Patients list scenarios (LIST-*). See PLAYWRIGHT_TEST_SCENARIOS.md.
 */
test.describe("Patients list", () => {
  let patientId = "";
  let fullName = "";
  let mobile = "";

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const name = uniqueName("فهرست");
    fullName = `${name.first} ${name.last}`;
    mobile = randomMobile();
    patientId = await createPatient(page, {
      first_name: name.first,
      last_name: name.last,
      national_id: randomNationalId(),
      mobile,
    });
    await page.close();
  });

  test("LIST-01 — table renders with the expected columns", async ({ page }) => {
    await page.goto("/patients");

    await expect(page.getByRole("heading", { name: "بیماران" })).toBeVisible();
    await expect(page.getByText(/بیمار ثبت/)).toBeVisible();

    const table = page.getByRole("table");
    await expect(table.getByRole("columnheader", { name: "نام و نام خانوادگی" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "کد ملی" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "موبایل" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "آخرین معاینه" })).toBeVisible();

    await expect(table.getByText(fullName, { exact: true })).toBeVisible();
    await expect(table.getByText(mobile, { exact: true })).toBeVisible();
  });

  test("LIST-02 — empty state when no patients exist", async ({ page }) => {
    const total = await patientTotal(page);
    test.skip(total > 0, "requires an empty patients table");

    await expect(page.getByText(fa("هنوز بیماری ثبت نشده است"))).toBeVisible();
    await expect(
      page.getByText(fa("اولین پرونده را با دکمه «بیمار جدید» بسازید.")),
    ).toBeVisible();
  });

  test("LIST-03 — search filters by name and by mobile", async ({ page }) => {
    await page.goto("/patients");

    // Search by last name (substring).
    const input = page.getByLabel("جستجوی بیمار");
    await input.fill(fullName.split(" ")[1]);
    await input.press("Enter");
    await expect(page.getByText(fullName, { exact: true })).toBeVisible();
    expect(page.url()).toContain("q=");

    // Search by mobile.
    await input.fill(mobile);
    await input.press("Enter");
    await expect(page.getByText(fullName, { exact: true })).toBeVisible();

    // No match → empty state.
    await input.fill("ناموجود-xyz");
    await input.press("Enter");
    await expect(page.getByText("بیماری یافت نشد")).toBeVisible();
  });

  test("LIST-05 — pagination is shown and navigates", async ({ page }) => {
    const total = await patientTotal(page);
    test.skip(total < 21, "seed ≥21 patients (e.g. supabase/seed/fake-patients.sql) to test pagination");

    await page.goto("/patients");
    await expect(page.getByText(/صفحه ۱ از/)).toBeVisible();

    // «قبلی» is disabled on page 1.
    await expect(page.getByRole("link", { name: "قبلی" })).toHaveCount(0);

    await page.getByRole("link", { name: "بعدی" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/صفحه ۲ از/)).toBeVisible();

    await page.getByRole("link", { name: "قبلی" }).click();
    await expect(page).toHaveURL(/page=1/);
  });

  test("LIST-06 — row action opens the patient profile", async ({ page }) => {
    await page.goto("/patients");
    const row = page.getByRole("row").filter({ hasText: fullName });
    await row.getByRole("link", { name: "پرونده" }).click();
    await expect(page).toHaveURL(new RegExp(`/patients/${patientId}`));
    await expect(
      page.getByRole("heading", { name: fullName, exact: true }),
    ).toBeVisible();
  });
});