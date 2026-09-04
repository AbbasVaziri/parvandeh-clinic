import { test, expect } from "@playwright/test";
import {
  createPatient,
  randomNationalId,
  randomMobile,
  uniqueName,
  fa,
} from "./helpers/data";

/**
 * Patient edit scenarios (PAT-E-*). See PLAYWRIGHT_TEST_SCENARIOS.md.
 */
test.describe("Patient edit", () => {
  const patientA = { id: "", name: "" };
  const patientB = { id: "", nationalId: "" };

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    const a = uniqueName("ویرایش");
    patientA.name = `${a.first} ${a.last}`;
    patientA.id = await createPatient(page, {
      first_name: a.first,
      last_name: a.last,
      national_id: randomNationalId(),
      mobile: randomMobile(),
      notes: "یادداشت اولیه",
    });

    const b = uniqueName("ویرایش");
    patientB.nationalId = randomNationalId();
    patientB.id = await createPatient(page, {
      first_name: b.first,
      last_name: b.last,
      national_id: patientB.nationalId,
      mobile: randomMobile(),
    });

    await page.close();
  });

  test("PAT-E-01 — form is pre-filled with current values", async ({ page }) => {
    await page.goto(`/patients/${patientA.id}/edit`);
    await expect(page.getByRole("heading", { name: "ویرایش بیمار" })).toBeVisible();
    await expect(page.locator("#first_name")).toHaveValue("ویرایش");
    await expect(page.locator("#notes")).toHaveValue("یادداشت اولیه");
  });

  test("PAT-E-02 — updating a patient redirects to the profile", async ({ page }) => {
    const newMobile = randomMobile();
    await page.goto(`/patients/${patientA.id}/edit`);
    await page.locator("#mobile").fill(newMobile);
    await page.locator("#notes").fill("یادداشت ویرایش‌شده");
    await page
      .getByRole("button", { name: "ذخیره تغییرات", exact: true })
      .click();

    await page.waitForURL(new RegExp(`/patients/${patientA.id}$`));
    await expect(page.getByText(fa("اطلاعات بیمار به‌روزرسانی شد."))).toBeVisible();
    await expect(page.getByText(newMobile, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(fa("یادداشت ویرایش‌شده"))).toBeVisible();
  });

  test("PAT-E-03 — changing to another patient's national ID is rejected", async ({ page }) => {
    await page.goto(`/patients/${patientA.id}/edit`);
    await page.locator("#national_id").fill(patientB.nationalId);
    await page
      .getByRole("button", { name: "ذخیره تغییرات", exact: true })
      .click();

    await expect(page.getByText(fa("بیمار دیگری با این کد ملی ثبت شده است."))).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/patients/${patientA.id}/edit`));
  });

  test("PAT-E-04 — cancel returns to the profile", async ({ page }) => {
    await page.goto(`/patients/${patientA.id}/edit`);
    await page.getByRole("button", { name: "انصراف", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/patients/${patientA.id}$`));
  });
});