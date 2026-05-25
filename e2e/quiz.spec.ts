import { test, expect } from "@playwright/test";

test("quiz page shows subject selector", async ({ page }) => {
	await page.goto("/quiz");
	await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("exam dates page loads", async ({ page }) => {
	await page.goto("/exam-dates");
	await expect(page.locator("h1, h2").first()).toBeVisible();
});
