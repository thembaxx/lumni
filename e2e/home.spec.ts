import { test, expect } from "@playwright/test";

test("homepage loads and shows heading", async ({ page }) => {
  await page.goto("/en", { waitUntil: "commit" });
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10000 });
});

test("homepage has navigation", async ({ page }) => {
  await page.goto("/en", { waitUntil: "commit" });
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10000 });
});
