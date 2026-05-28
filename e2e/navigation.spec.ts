import { test, expect } from "@playwright/test";

test.describe("View transitions", () => {
	test("sets data-vt-direction on bottom nav navigation", async ({ page }) => {
		await page.goto("/en/dashboard", { waitUntil: "networkidle" });

		const quizLink = page.locator("nav a[href*='/quiz']").first();
		await expect(quizLink).toBeVisible({ timeout: 10000 });

		await quizLink.click();

		const vtDirection = await page.evaluate(() =>
			document.documentElement.getAttribute("data-vt-direction"),
		);

		expect(vtDirection).toBe("forward");
	});

	test("sets back direction when navigating up", async ({ page }) => {
		await page.goto("/en/quiz", { waitUntil: "networkidle" });

		const dashboardLink = page.locator("nav a[href*='/dashboard']").first();
		await expect(dashboardLink).toBeVisible({ timeout: 10000 });

		await dashboardLink.click();

		const vtDirection = await page.evaluate(() =>
			document.documentElement.getAttribute("data-vt-direction"),
		);

		expect(vtDirection).toBe("back");
	});
});
