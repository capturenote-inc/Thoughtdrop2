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

  const colorButton = page.getByRole("button", { name: "Color" });
  await colorButton.click();
  await expect(page.getByRole("group", { name: "Page color" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("group", { name: "Page color" })).toBeHidden();
  await expect(colorButton).toBeFocused();

  await page.getByRole("button", { name: "Archive" }).click();
  await expect(page).toHaveURL(/\/pages$/);
  await expect(page.getByText(`${tag} archived.`)).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText(`${tag} restored.`)).toBeVisible();
});

test("new page form validates and suggests an editable routing tag", async ({ page }) => {
  const suffix = Date.now().toString(36);
  const title = `E2E Planning ${suffix}`;
  const expectedTag = `e2e-planning-${suffix}`;

  await page.goto("/pages?new=1");
  await page.getByRole("button", { name: "Create page" }).click();
  await expect(page.getByText("Add a page title.")).toBeVisible();
  await expect(page.getByLabel("Title")).toBeFocused();

  await page.getByLabel("Title").fill(title);
  await expect(page.getByLabel("Routing tag")).toHaveValue(expectedTag);
  await expect(page.getByText("Suggested from the title. You can edit it.")).toBeVisible();
  await page.getByRole("button", { name: "Create page" }).click();
  await expect(page.getByRole("link", { name: new RegExp(title) }).first()).toBeVisible();

  const childTitle = `Nested ${suffix}`;
  await page.getByRole("button", { name: "New page" }).click();
  await page.getByLabel("Title").fill(childTitle);
  await page.getByLabel("Parent").selectOption({ label: title });
  await page.getByRole("button", { name: "Create page" }).click();
  await page.getByRole("link", { name: new RegExp(`^${title}`) }).first().click();
  await page.getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText(`${title} and 1 nested pages archived.`)).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText(`${title} restored.`)).toBeVisible();
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
