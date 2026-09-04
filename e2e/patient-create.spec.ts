import { test, expect } from "@playwright/test";
import {
  createPatient,
  fillPatientForm,
  submitPatientForm,
  randomNationalId,
  randomMobile,
  uniqueName,
  tinyPng,
  bigFile,
  fa,
} from "./helpers/data";

/**
 * Patient creation scenarios (PAT-C-*). See PLAYWRIGHT_TEST_SCENARIOS.md.
 */
test.describe("Patient creation", () => {
  test("PAT-C-01 — create a valid patient redirects to the profile", async ({ page }) => {
    const name = uniqueName("ثبت");
    const id = await createPatient(page, {
      first_name: name.first,
      last_name: name.last,
      national_id: randomNationalId(),
      mobile: randomMobile(),
      address: "تهران، خیابان آزادی",
      notes: "یادداشت نمونه",
    });

    await expect(
      page.getByRole("heading", { name: `${name.first} ${name.last}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("تهران، خیابان آزادی")).toBeVisible();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("PAT-C-02 — required first/last name show inline errors", async ({ page }) => {
    await page.goto("/patients/new");
    await submitPatientForm(page);

    await expect(page.getByText("نام الزامی است", { exact: true })).toBeVisible();
    await expect(page.getByText("نام خانوادگی الزامی است", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/patients\/new$/);
  });

  test("PAT-C-03 — national ID must be 10 digits", async ({ page }) => {
    await page.goto("/patients/new");
    await fillPatientForm(page, {
      first_name: "تست",
      last_name: "کد ملی",
      national_id: "123456789", // 9 digits
      mobile: randomMobile(),
    });
    await submitPatientForm(page);
    await expect(page.getByText(fa("کد ملی باید ۱۰ رقم باشد"))).toBeVisible();
  });

  test("PAT-C-04 — national ID checksum is validated", async ({ page }) => {
    await page.goto("/patients/new");
    await fillPatientForm(page, {
      first_name: "تست",
      last_name: "کد ملی",
      national_id: "1234567890", // valid length, invalid checksum
      mobile: randomMobile(),
    });
    await submitPatientForm(page);
    await expect(page.getByText(fa("کد ملی وارد شده معتبر نیست"))).toBeVisible();
  });

  test("PAT-C-05 — invalid mobile is rejected", async ({ page }) => {
    await page.goto("/patients/new");
    await fillPatientForm(page, {
      first_name: "تست",
      last_name: "موبایل",
      national_id: randomNationalId(),
      mobile: "02112345678", // landline
    });
    await submitPatientForm(page);
    await expect(
      page.getByText(fa("شماره موبایل معتبر نیست (نمونه: ۰۹۱۲۳۴۵۶۷۸۹)")),
    ).toBeVisible();
  });

  test("PAT-C-06 — mobile input is normalized", async ({ page }) => {
    const variants = [
      "۰۹۱۲۳۴۵۶۷۸۹", // Persian digits
      "00989123456789", // international prefix
      "989123456789", // without leading 0
      "9123456789", // 10 digits
    ];
    const ids: string[] = [];
    for (let i = 0; i < variants.length; i++) {
      const name = uniqueName("نرمال");
      ids.push(
        await createPatient(page, {
          first_name: name.first,
          last_name: name.last,
          national_id: randomNationalId(),
          mobile: variants[i],
        }),
      );
      // Profile badge shows the normalized mobile.
      await expect(
        page.getByText("09123456789", { exact: true }).first(),
      ).toBeVisible();
      await page.goto("/patients");
    }
    expect(ids).toHaveLength(variants.length);
  });

  test("PAT-C-07 — duplicate national ID is rejected", async ({ page }) => {
    const id = randomNationalId();
    const name = uniqueName("تکراری");
    await createPatient(page, {
      first_name: name.first,
      last_name: name.last,
      national_id: id,
      mobile: randomMobile(),
    });

    // Try to register a second patient with the same national ID.
    await page.goto("/patients/new");
    const second = uniqueName("تکراری");
    await fillPatientForm(page, {
      first_name: second.first,
      last_name: second.last,
      national_id: id,
      mobile: randomMobile(),
    });
    await submitPatientForm(page);

    await expect(page.getByText(fa("بیماری با این کد ملی قبلاً ثبت شده است."))).toBeVisible();
    await expect(page).toHaveURL(/\/patients\/new$/);
  });

  test("PAT-C-08 — avatar upload shows a preview", async ({ page }) => {
    await page.goto("/patients/new");
    await fillPatientForm(page, {
      first_name: "تست",
      last_name: "عکس",
      national_id: randomNationalId(),
      mobile: randomMobile(),
    });
    await page.locator('input[type="file"]').setInputFiles(tinyPng("avatar.png"));
    await expect(page.getByRole("img", { name: "عکس بیمار" })).toBeVisible();
  });

  test("PAT-C-09 — avatar rejects non-image files", async ({ page }) => {
    await page.goto("/patients/new");
    await page.locator('input[type="file"]').setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello"),
    });
    await expect(page.getByText(fa("عکس پروفایل باید یک تصویر باشد."))).toBeVisible();
    await expect(page.getByText("انتخاب عکس")).toBeVisible();
  });

  test("PAT-C-10 — avatar larger than 5 MB is rejected", async ({ page }) => {
    await page.goto("/patients/new");
    await page.locator('input[type="file"]').setInputFiles(
      bigFile(5 * 1024 * 1024 + 1, "huge.png"),
    );
    await expect(page.getByText(fa("حجم عکس حداکثر ۵ مگابایت است."))).toBeVisible();
  });

  test("PAT-C-13 — cancel returns to the patients list", async ({ page }) => {
    await page.goto("/patients/new");
    await page.getByRole("button", { name: "انصراف", exact: true }).click();
    await expect(page).toHaveURL(/\/patients$/);
  });
});