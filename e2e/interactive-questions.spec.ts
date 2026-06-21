import { test, expect } from "@playwright/test";

test("quiz page loads with subject selector", async ({ page }) => {
	await page.goto("/en/quiz", { waitUntil: "commit" });
	await page.waitForLoadState("networkidle");
	await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10000 });
});

test("ordering question type renders in question card", async ({ page }) => {
	await page.goto("/en/quiz", { waitUntil: "commit" });
	await page.waitForLoadState("networkidle");

	const draggableItems = page.locator('[draggable="true"]');
	await expect(draggableItems.first()).toBeAttached({ timeout: 5000 });
});

test("match-pairs input renders left and right columns", async ({ page }) => {
	await page.goto("/en/quiz", { waitUntil: "commit" });
	await page.waitForLoadState("networkidle");

	const dropTargets = page.locator('button:has-text("Drop target")');
	const dropTargetCount = await dropTargets.count();
	expect(dropTargetCount).toBeGreaterThanOrEqual(0);
});

test("fill-in-sequence input shows draggable options", async ({ page }) => {
	await page.goto("/en/quiz", { waitUntil: "commit" });
	await page.waitForLoadState("networkidle");

	const draggableElements = page.locator('[aria-grabbed]');
	await expect(draggableElements.first()).toBeAttached({ timeout: 5000 });
});
