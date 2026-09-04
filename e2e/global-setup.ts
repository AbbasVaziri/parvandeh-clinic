import { chromium, type FullConfig } from "@playwright/test";
import { RECEPTION } from "./helpers/auth";

/**
 * Signs in once with the reception account and saves the session cookie to
 * e2e/.auth/reception.json so every spec reuses it (playwright.config.ts →
 * `use.storageState`). Specs themselves never test the login flow.
 *
 * Prerequisite: `npm run seed` must have created the reception account, and
 * the app must be able to reach Supabase via `.env.local`.
 */
export default async function globalSetup(
  config: FullConfig,
): Promise<void> {
  const baseURL = config.projects[0].use.baseURL;
  if (!baseURL) throw new Error("playwright.config.ts: baseURL is not set");

  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(`${baseURL}/login`);
    await page.locator("#email").fill(RECEPTION.email);
    await page.locator("#password").fill(RECEPTION.password);
    await page.getByRole("button", { name: "ورود", exact: true }).click();
    await page.waitForURL(`${baseURL}/`, { timeout: 20_000 });
    await page.context().storageState({
      path: "e2e/.auth/reception.json",
    });
    console.log(`✓ e2e session saved for ${RECEPTION.email}`);
  } catch (error) {
    console.error(
      `✗ Could not sign in as ${RECEPTION.email}. ` +
        "Check that the dev server is up, .env.local points to a reachable " +
        "Supabase project, and the seed accounts exist (`npm run seed`).",
    );
    throw error;
  } finally {
    await browser.close();
  }
}