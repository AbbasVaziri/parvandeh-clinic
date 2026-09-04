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
 * Patient profile scenarios (PAT-P-*). See PLAYWRIGHT_TEST_SCENARIOS.md.
 */
test.describe("Patient profile", () => {
  let patientId = "";
  let fullName = "";
  let nationalId = "";
  let mobile = "";

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const name = uniqueName("پروفایل");
    fullName = `${name.first} ${name.last}`;
    nationalId = randomNationalId();
    mobile = randomMobile();
    patientId = await createPatient(page, {
      first_name: name.first,
      last_name: name.last,
      national_id: nationalId,
      mobile,
      address: "اصفهان، خیابان چهارباغ",
      notes: "توضیحات پروفایل",
    });
    await createExam(page, patientId, {
      vaOdSc: "6/6",
      diagnosis: "تشخیص نمونه پروفایل",
    });
    await page.close();
  });

  test("PAT-P-01 — info tab shows all patient fields", async ({ page }) => {
    await page.goto(`/patients/${patientId}`);
    await expect(
      page.getByRole("heading", { name: fullName, exact: true }),
    ).toBeVisible();
    await expect(page.getByText(nationalId, { exact: true })).toBeVisible();
    await expect(page.getByText(mobile, { exact: true })).toBeVisible();
    await expect(page.getByText("اصفهان، خیابان چهارباغ")).toBeVisible();
    await expect(page.getByText("توضیحات پروفایل")).toBeVisible();
  });

  test("PAT-P-02 — tabs switch and update the URL", async ({ page }) => {
    await page.goto(`/patients/${patientId}`);
    await page.getByRole("tab", { name: /سوابق معاینه/ }).click();
    await expect(page).toHaveURL(/tab=exams/);

    await page.getByRole("tab", { name: /مدارک و تصاویر/ }).click();
    await expect(page).toHaveURL(/tab=docs/);
  });

  test("PAT-P-03 — exams tab shows an empty state for a new patient", async ({ page }) => {
    const id = await createPatient(page, {
      first_name: "بدون",
      last_name: "معاینه",
      national_id: randomNationalId(),
      mobile: randomMobile(),
    });
    await page.goto(`/patients/${id}?tab=exams`);
    await expect(page.getByText(fa("هنوز معاینه‌ای ثبت نشده است"))).toBeVisible();
    await page
      .getByRole("link", { name: "ثبت معاینه جدید", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/patients/${id}/examinations/new`));
  });

  test("PAT-P-04 — exams tab lists saved examinations", async ({ page }) => {
    await page.goto(`/patients/${patientId}?tab=exams`);
    await expect(page.getByText("تشخیص نمونه پروفایل")).toBeVisible();
    await expect(page.getByText(fa("معاینه ۱"), { exact: true })).toBeVisible();
    await expect(page.getByText("6/6")).toBeVisible();
  });

  test("PAT-P-05 — docs tab shows an empty state", async ({ page }) => {
    await page.goto(`/patients/${patientId}?tab=docs`);
    await expect(page.getByText(fa("هنوز مدرکی افزوده نشده است"))).toBeVisible();
    await page.getByRole("button", { name: "افزودن مدرک / تصویر" }).click();
    await expect(page.getByText("افزودن مدرک / تصویر").last()).toBeVisible();
  });

  test("PAT-P-06 — unknown patient id renders 404", async ({ page }) => {
    await page.goto("/patients/00000000-0000-4000-8000-000000000000");
    await expect(page.getByText("صفحه مورد نظر پیدا نشد")).toBeVisible();
  });

  test("PAT-P-07 — action buttons navigate", async ({ page }) => {
    await page.goto(`/patients/${patientId}`);
    await page
      .getByRole("link", { name: "ثبت معاینه جدید", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/patients/${patientId}/examinations/new`));

    await page.goto(`/patients/${patientId}`);
    // The profile header has the patient edit button (exam cards may also show
    // a same-day «ویرایش» button — disambiguate by href).
    await page.locator(`a[href="/patients/${patientId}/edit"]`).click();
    await expect(page).toHaveURL(new RegExp(`/patients/${patientId}/edit`));
  });
});