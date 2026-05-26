import { test, expect } from "@playwright/test";

test("quiz page shows subject selector", async ({ page }) => {
	await page.goto("/en/quiz", { waitUntil: "commit" });
	await page.waitForLoadState("networkidle");
	await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10000 });
});

test("exam dates page loads", async ({ page }) => {
	await page.goto("/en/exam-dates", { waitUntil: "commit" });
	await page.waitForLoadState("networkidle");
	await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10000 });
});
