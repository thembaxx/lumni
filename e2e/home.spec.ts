import { test, expect } from "@playwright/test";

test("homepage loads and shows heading", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("navigation links are present", async ({ page }) => {
	await page.goto("/");
	const nav = page.locator("nav, header, [role='navigation']").first();
	await expect(nav).toBeVisible();
});
