import { expect, test } from "@playwright/test";
import { requireDisposableEnvironment, signIn } from "./helpers";

const viewports = [
  { width: 320, height: 720 },
  { width: 375, height: 812 },
  { width: 768, height: 900 },
  { width: 1280, height: 900 },
  { width: 1440, height: 1000 },
];

test("authenticated shell never overflows and mobile navigation is usable", async ({ page }) => {
  requireDisposableEnvironment();
  await signIn(page);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth, `${viewport.width}px viewport overflowed`).toBeLessThanOrEqual(dimensions.clientWidth);

    if (viewport.width < 768) {
      const menu = page.getByRole("button", { name: "Open navigation" });
      await expect(menu).toBeVisible();
      await menu.click();
      await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
      await page.getByRole("button", { name: "Close navigation", exact: true }).click();
      await expect(menu).toBeFocused();
    }
  }
});
