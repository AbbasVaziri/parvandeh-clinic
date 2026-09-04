import type { Page } from "@playwright/test";

/**
 * Staff accounts created by `npm run seed` (scripts/seed-users.mjs).
 * Override via environment variables if the passwords were rotated.
 */
export const RECEPTION = {
  email: process.env.E2E_EMAIL ?? "abbas.javanshir18@gmail.com",
  password: process.env.E2E_PASSWORD ?? "123456",
};

export const DOCTOR = {
  email: process.env.E2E_DOCTOR_EMAIL ?? "doctor@clinic.local",
  password: process.env.E2E_DOCTOR_PASSWORD ?? "Doctor@1234",
};

/** Sign in through the login form and wait until the dashboard loads. */
export async function signIn(
  page: Page,
  email: string = RECEPTION.email,
  password: string = RECEPTION.password,
): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await page.waitForURL("/");
}