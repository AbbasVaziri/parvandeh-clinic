import { test, expect } from "@playwright/test";
import { statValue } from "./helpers/data";

/**
 * Global UI scenarios (UI-*). See PLAYWRIGHT_TEST_SCENARIOS.md.
 */
test.describe("Global UI", () => {
  test("UI-01 — the theme toggle switches dark/light mode", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const before = (await html.getAttribute("class")) ?? "";

    await page.getByRole("button", { name: "تغییر تم" }).click();
    const after = (await html.getAttribute("class")) ?? "";
    expect(before.includes("dark")).not.toBe(after.includes("dark"));

    // Restore the original theme so other tests are unaffected.
    await page.getByRole("button", { name: "تغییر تم" }).click();
    const restored = (await html.getAttribute("class")) ?? "";
    expect(restored.includes("dark")).toBe(before.includes("dark"));
  });

  test("UI-02 — the document is RTL Persian", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  });

  test("UI-03 — a mobile viewport shows the bottom navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.locator("aside")).toBeHidden();
    const bottomNav = page.locator("nav.fixed.inset-x-0.bottom-0");
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "داشبورد" })).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "بیماران" })).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "تنظیمات" })).toBeVisible();

    await bottomNav.getByRole("link", { name: "بیماران" }).click();
    await expect(page).toHaveURL(/\/patients$/);
  });

  test("UI-04 — stat values render as Persian digits", async ({ page }) => {
    const value = await statValue(page, "بیماران");
    expect(value).toMatch(/^[۰-۹]+$/);
  });
});