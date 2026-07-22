import { expect, type Page } from "@playwright/test";

export function requireDisposableEnvironment() {
  if (process.env.E2E_DISPOSABLE_WORKSPACE !== "1") {
    throw new Error("Refusing mutation tests without E2E_DISPOSABLE_WORKSPACE=1.");
  }
  if (!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD) {
    throw new Error("Set isolated E2E_EMAIL and E2E_PASSWORD credentials.");
  }
}

export async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_EMAIL as string);
  await page.getByLabel("Password").fill(process.env.E2E_PASSWORD as string);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
}
