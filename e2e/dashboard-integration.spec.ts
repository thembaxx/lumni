import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
	test("loads and shows main sections", async ({ page }) => {
		await page.goto("/en", { waitUntil: "commit" });
		await page.waitForLoadState("networkidle");
		await expect(page.locator("h1, h2").first()).toBeVisible({
			timeout: 10000,
		});
	});

	test("has navigation sidebar or bottom nav", async ({ page }) => {
		await page.goto("/en", { waitUntil: "commit" });
		await page.waitForLoadState("networkidle");
		const nav = page.locator("nav, [role='navigation']").first();
		await expect(nav).toBeVisible({ timeout: 10000 });
	});
});

test.describe("Vocabulary flashcard mode", () => {
	test("loads with mode=vocabulary param", async ({ page }) => {
		await page.goto("/en/flashcards?mode=vocabulary", { waitUntil: "commit" });
		await page.waitForLoadState("networkidle");
		await expect(page.locator("h1, h2").first()).toBeVisible({
			timeout: 10000,
		});
	});
});

test.describe("Story reader", () => {
	test("story library loads", async ({ page }) => {
		await page.goto("/en/stories", { waitUntil: "commit" });
		await page.waitForLoadState("networkidle");
		await expect(page.locator("h1, h2").first()).toBeVisible({
			timeout: 10000,
		});
	});
});
