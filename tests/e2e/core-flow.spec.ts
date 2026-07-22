import { expect, test } from "@playwright/test";
import { requireDisposableEnvironment, signIn } from "./helpers";

test.beforeEach(async ({ page }) => {
  requireDisposableEnvironment();
  await signIn(page);
});

test("capture to Inbox to Page with recoverable deletion", async ({ page }) => {
  const suffix = Date.now().toString(36);
  const tag = `e2e-${suffix}`;
  const body = `Disposable routing check ${suffix} #${tag}`;

  await page.getByRole("button", { name: "Capture", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New note" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Note text").fill(body);
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Note saved to Inbox.")).toBeVisible();

  await page.getByRole("link", { name: "Inbox", exact: true }).click();
  const note = page.getByText(body, { exact: true });
  await expect(note).toBeVisible();
  await page.getByRole("button", { name: `Create #${tag}` }).click();
  await expect(note).toBeHidden();

  await page.goto(`/pages/${tag}`);
  await expect(page.getByRole("heading", { name: tag })).toBeVisible();
  await expect(page.getByText(body, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Note moved to recently deleted.")).toBeVisible();
  await expect(page.getByText(body, { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("Note restored.")).toBeVisible();
  await expect(page.getByText(body, { exact: true })).toBeVisible();
});

test("Capture traps focus and restores it to its opener", async ({ page }) => {
  const capture = page.getByRole("button", { name: "Capture", exact: true });
  await capture.focus();
  await capture.click();
  const dialog = page.getByRole("dialog", { name: "New note" });
  const editor = dialog.getByLabel("Note text");
  await expect(editor).toBeFocused();
  await editor.fill("Unsaved focus trap check");

  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Close note editor" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Save" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close note editor" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(capture).toBeFocused();
});
