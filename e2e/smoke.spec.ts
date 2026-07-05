import { test } from "@playwright/test";

test("smoke", async ({ page }) => {
  await page.goto("/en", { waitUntil: "networkidle" });
});
