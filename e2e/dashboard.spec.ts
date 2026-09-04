import { test, expect } from "@playwright/test";
import {
  createPatient,
  createExam,
  randomNationalId,
  randomMobile,
  uniqueName,
  statValue,
  faToEn,
  fa,
} from "./helpers/data";

/**
 * Dashboard scenarios (DASH-*). See PLAYWRIGHT_TEST_SCENARIOS.md.
 */
test.describe("Dashboard", () => {
  let patientId = "";
  let patientName = "";

  // One patient + one exam, created once per file (workers are serialized).
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const name = uniqueName("آزمایش");
    patientName = `${name.first} ${name.last}`;
    patientId = await createPatient(page, {
      first_name: name.first,
      last_name: name.last,
      national_id: randomNationalId(),
      mobile: randomMobile(),
    });
    await createExam(page, patientId, { vaOdSc: "6/6", diagnosis: "تشخیص نمونه داشبورد" });
    await page.close();
  });

  test("DASH-01 — stat cards increment when data is added", async ({ page }) => {
    const before = Number(faToEn(await statValue(page, "بیماران")));

    const name = uniqueName("آمار");
    await createPatient(page, {
      first_name: name.first,
      last_name: name.last,
      national_id: randomNationalId(),
      mobile: randomMobile(),
    });

    const after = Number(faToEn(await statValue(page, "بیماران")));
    expect(after).toBe(before + 1);
    expect(faToEn(await statValue(page, "معاینه‌ها"))).toMatch(/^\d+$/);
  });

  test("DASH-02 — hero search finds a patient by name", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("جستجوی بیمار").fill(patientName.split(" ")[0]);

    const row = page.getByText(patientName, { exact: true }).last();
    await expect(row).toBeVisible();
    await row
      .locator("xpath=ancestor::li")
      .getByRole("link", { name: "مشاهده پرونده" })
      .click();
    await expect(page).toHaveURL(new RegExp(`/patients/${patientId}`));
  });

  test("DASH-03 — hero search finds a patient by mobile", async ({ page }) => {
    // Create a patient with a known mobile, then search by it.
    const mobile = randomMobile();
    const name = uniqueName("موبایل");
    await createPatient(page, {
      first_name: name.first,
      last_name: name.last,
      national_id: randomNationalId(),
      mobile,
    });

    await page.goto("/");
    await page.getByLabel("جستجوی بیمار").fill(mobile.slice(0, 8));
    await expect(page.getByText(name.last, { exact: true })).toBeVisible();
  });

  test("DASH-04 — hero search with no matches shows the empty state", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("جستجوی بیمار").fill("بیمار-ناموجود-xyz");

    await expect(page.getByText("بیماری یافت نشد")).toBeVisible();
    await expect(
      page.getByText("عبارت دیگری را امتحان کنید یا بیمار جدید ثبت کنید."),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "ثبت بیمار جدید", exact: true })
      .click();
    await expect(page).toHaveURL(/\/patients\/new$/);
  });

  test("DASH-05 — hero search below 2 characters shows nothing", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("جستجوی بیمار");
    await input.fill("آ");
    await expect(page.getByText("بیماری یافت نشد")).toHaveCount(0);
    await expect(page.locator("ul").filter({ hasText: "مشاهده پرونده" })).toHaveCount(0);

    await input.fill("");
    await expect(page.getByText("بیماری یافت نشد")).toHaveCount(0);
  });

  test("DASH-06 — recent patients list links to the profile", async ({ page }) => {
    await page.goto("/");
    const section = page
      .locator("h2")
      .filter({ hasText: "بیماران اخیر" })
      .locator("..");
    await expect(section.getByText(patientName, { exact: true })).toBeVisible();
    await section.getByRole("link", { name: "پرونده" }).first().click();
    await expect(page).toHaveURL(/\/patients\/[0-9a-f-]{36}$/);
  });

  test("DASH-07 — recent exams list links to the exam page", async ({ page }) => {
    await page.goto("/");
    const section = page
      .locator("h2")
      .filter({ hasText: fa("معاینه‌های اخیر") })
      .locator("..");
    await expect(section.getByText(patientName, { exact: true })).toBeVisible();
    await section.getByRole("link", { name: "مشاهده" }).first().click();
    await expect(page).toHaveURL(/\/examinations\/[0-9a-f-]{36}$/);
  });

  test("DASH-09 — quick actions navigate correctly", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "بیمار جدید", exact: true }).click();
    await expect(page).toHaveURL(/\/patients\/new$/);

    await page.goto("/");
    await page.getByRole("link", { name: "همه بیماران", exact: true }).click();
    await expect(page).toHaveURL(/\/patients$/);
  });
});