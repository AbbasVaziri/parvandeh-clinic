import { test, expect } from "@playwright/test";
import {
  createPatient,
  randomNationalId,
  randomMobile,
  uniqueName,
  fa,
} from "./helpers/data";
import { RECEPTION } from "./helpers/auth";

/**
 * Settings scenarios (SET-*). See PLAYWRIGHT_TEST_SCENARIOS.md.
 *
 * Settings are global (shared table), so each test restores the values it
 * changed to keep the rest of the suite deterministic.
 */
test.describe("Settings", () => {
  let patientId = "";

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const name = uniqueName("تنظیمات");
    patientId = await createPatient(page, {
      first_name: name.first,
      last_name: name.last,
      national_id: randomNationalId(),
      mobile: randomMobile(),
    });
    await page.close();
  });

  test("SET-01 — changing the clinic name updates the topbar", async ({ page }) => {
    await page.goto("/settings");
    const input = page.locator("#clinic_name");
    const previous = (await input.inputValue()).trim() || "کلینیک چشم‌پزشکی";
    const newName = `کلینیک تست ${Date.now()}`;

    await input.fill(newName);
    await page.getByRole("button", { name: "ذخیره تنظیمات", exact: true }).click();
    await expect(page.getByText(fa("تنظیمات ذخیره شد."))).toBeVisible();
    await expect(page.getByText(newName, { exact: true }).first()).toBeVisible();

    // Restore the previous name.
    await page.goto("/settings");
    await page.locator("#clinic_name").fill(previous);
    await page.getByRole("button", { name: "ذخیره تنظیمات", exact: true }).click();
    await expect(page.getByText(fa("تنظیمات ذخیره شد."))).toBeVisible();
  });

  test("SET-02/03/04 — custom exam-form tables can be added, edited and removed", async ({ page }) => {
    const tableLabel = `جدول فشار چشم ${Date.now()}`;

    // Add a custom table with custom rows/columns.
    await page.goto("/settings");
    await page.getByRole("button", { name: "جدول جدید", exact: true }).click();
    const section = page
      .locator("div")
      .filter({ hasText: tableLabel })
      .filter({ has: page.getByLabel("عنوان جدول") })
      .last();
    await section.locator("input").first().fill(tableLabel);
    await section.locator("input").nth(1).fill("راست، چپ");
    await section.locator("input").nth(2).fill("IOP، قطر");
    await page.getByRole("button", { name: "ذخیره تنظیمات", exact: true }).click();
    await expect(page.getByText(fa("تنظیمات ذخیره شد."))).toBeVisible();

    // The new table shows up in the exam form with the configured grid.
    await page.goto(`/patients/${patientId}/examinations/new`);
    await expect(page.getByRole("heading", { name: tableLabel, exact: true })).toBeVisible();
    const table = page
      .locator("h2")
      .filter({ hasText: tableLabel })
      .locator("..")
      .getByRole("table");
    await expect(table.getByRole("columnheader", { name: "IOP" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "قطر" })).toBeVisible();
    await expect(table.getByText("راست")).toBeVisible();
    await expect(table.getByText("چپ")).toBeVisible();

    // Removing the table removes it from the exam form.
    await page.goto("/settings");
    const addedSection = page
      .locator("div")
      .filter({ hasText: tableLabel })
      .filter({ has: page.getByLabel("عنوان جدول") })
      .last();
    await addedSection.getByRole("button", { name: "حذف جدول" }).click();
    await page.getByRole("button", { name: "ذخیره تنظیمات", exact: true }).click();
    await expect(page.getByText(fa("تنظیمات ذخیره شد."))).toBeVisible();

    await page.goto(`/patients/${patientId}/examinations/new`);
    await expect(page.getByRole("heading", { name: tableLabel, exact: true })).toHaveCount(0);
  });

  test("SET-06 — the account card shows the signed-in email and role", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText(RECEPTION.email, { exact: true })).toBeVisible();
    await expect(page.getByText("پذیرش", { exact: true })).toBeVisible();
  });
});