import { test, expect } from "@playwright/test";
import {
  createPatient,
  randomNationalId,
  randomMobile,
  uniqueName,
  tinyPng,
  tinyPdf,
  bigFile,
  fa,
} from "./helpers/data";

/**
 * Patient documents scenarios (DOC-*). See PLAYWRIGHT_TEST_SCENARIOS.md.
 */
test.describe("Documents", () => {
  let patientId = "";

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const name = uniqueName("مدارک");
    patientId = await createPatient(page, {
      first_name: name.first,
      last_name: name.last,
      national_id: randomNationalId(),
      mobile: randomMobile(),
    });
    await page.close();
  });

  /** Open the docs tab with the upload dialog ready. */
  async function openUploadDialog(page: import("@playwright/test").Page) {
    await page.goto(`/patients/${patientId}?tab=docs`);
    await page.getByRole("button", { name: "افزودن مدرک / تصویر" }).click();
    await page.getByRole("dialog").waitFor();
  }

  test("DOC-01 — uploading an image shows a card with a thumbnail", async ({ page }) => {
    await openUploadDialog(page);
    await page.locator('input[type="file"]').first().setInputFiles(tinyPng("lab-report.png"));

    // Title is auto-filled from the file name (without extension).
    await expect(page.locator("#doc_title")).toHaveValue("lab-report");
    await page.getByRole("button", { name: "افزودن", exact: true }).click();

    await expect(page.getByText(fa("مدرک با موفقیت افزوده شد."))).toBeVisible();
    const card = page.getByText("lab-report", { exact: true }).locator("..").locator("..");
    await expect(card).toBeVisible();
    await expect(card.getByRole("img", { name: "lab-report" })).toBeVisible();
    await expect(card.getByRole("link", { name: "مشاهده" })).toHaveAttribute("href", /.+/);
  });

  test("DOC-02 — uploading a PDF shows the file icon", async ({ page }) => {
    await openUploadDialog(page);
    await page.locator('input[type="file"]').first().setInputFiles(tinyPdf("prescription.pdf"));
    await page.getByRole("button", { name: "افزودن", exact: true }).click();

    await expect(page.getByText(fa("مدرک با موفقیت افزوده شد."))).toBeVisible();
    const card = page.getByText("prescription", { exact: true }).locator("..").locator("..");
    await expect(card).toBeVisible();
    // PDFs show a generic file icon, not an image thumbnail.
    await expect(card.getByRole("img")).toHaveCount(0);
    await expect(card.getByRole("link", { name: "مشاهده" })).toBeVisible();
  });

  test("DOC-03 — a missing title blocks the upload", async ({ page }) => {
    await openUploadDialog(page);
    await page.locator('input[type="file"]').first().setInputFiles(tinyPng("untitled.png"));
    await page.locator("#doc_title").fill("");
    await page.getByRole("button", { name: "افزودن", exact: true }).click();

    await expect(page.getByText(fa("عنوان مدرک را وارد کنید."))).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("DOC-04 — unsupported file types are rejected", async ({ page }) => {
    await openUploadDialog(page);
    await page.locator('input[type="file"]').first().setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
    await expect(page.getByText(fa("فقط تصویر یا فایل PDF پذیرفته می‌شود."))).toBeVisible();
  });

  test("DOC-05 — files over 10 MB are rejected", async ({ page }) => {
    await openUploadDialog(page);
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles(bigFile(10 * 1024 * 1024 + 1, "huge.png"));
    await expect(page.getByText(fa("حجم فایل حداکثر ۱۰ مگابایت است."))).toBeVisible();
  });

  test("DOC-06 — deleting a document requires confirmation", async ({ page }) => {
    await openUploadDialog(page);
    await page.locator('input[type="file"]').first().setInputFiles(tinyPng("to-delete.png"));
    await page.getByRole("button", { name: "افزودن", exact: true }).click();
    await expect(page.getByText(fa("مدرک با موفقیت افزوده شد."))).toBeVisible();

    const card = page.getByText("to-delete", { exact: true }).locator("..").locator("..");
    await card.getByRole("button", { name: "حذف مدرک" }).click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText(fa("«to-delete» برای همیشه حذف می‌شود. این عمل قابل بازگشت نیست."))).toBeVisible();
    await page.getByRole("button", { name: "حذف", exact: true }).click();

    await expect(page.getByText(fa("مدرک حذف شد."))).toBeVisible();
    await expect(page.getByText("to-delete", { exact: true })).toHaveCount(0);
  });

  test("DOC-07 — cancelling the delete keeps the document", async ({ page }) => {
    await openUploadDialog(page);
    await page.locator('input[type="file"]').first().setInputFiles(tinyPng("keep-me.png"));
    await page.getByRole("button", { name: "افزودن", exact: true }).click();
    await expect(page.getByText(fa("مدرک با موفقیت افزوده شد."))).toBeVisible();

    const card = page.getByText("keep-me", { exact: true }).locator("..").locator("..");
    await card.getByRole("button", { name: "حذف مدرک" }).click();
    await page.getByRole("button", { name: "انصراف", exact: true }).click();

    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByText("keep-me", { exact: true })).toBeVisible();
  });
});