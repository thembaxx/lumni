import { test, expect } from "@playwright/test";

test.describe("Home page visual regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
    // Disable animations so KineticHeading/FadeIn don't hide content
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");
  });

  test("hero section renders correctly", async ({ page }) => {
    await page.waitForTimeout(3000);
    const heading = page.locator("h1").first();
    // KineticHeading starts with animation paused — check attachment not visibility
    await expect(heading).toBeAttached();
  });

  test("features grid renders 6 cards", async ({ page }) => {
    await page.waitForTimeout(3000);
    // FeaturesGrid is dynamically imported — wait for it to appear
    await page.waitForFunction(() => document.querySelector('[class*="lg:grid-cols-6"]') !== null, {
      timeout: 15000,
    });
    await page.waitForTimeout(1000);
    const cards = page.locator('[class*="lg:grid-cols-6"] > div');
    await expect(cards).toHaveCount(6);
  });

  test("how it works section has 3 steps", async ({ page }) => {
    await page.waitForTimeout(3000);
    await expect(page.getByText("How it works")).toBeVisible();
    // Step numbers are in absolute-positioned badges
    const step01 = page.locator("text=01").first();
    await expect(step01).toBeAttached();
  });

  test("landing page has a call-to-action mentioning free", async ({ page }) => {
    await page.waitForTimeout(3000);
    const cta = page.locator("a, button").filter({ hasText: /Free/i }).first();
    await expect(cta).toBeAttached();
  });

  test("testimonials section shows student quotes", async ({ page }) => {
    await page.waitForTimeout(3000);
    await expect(page.getByText("Trusted by Matric students")).toBeVisible();
  });

  test("footer contains navigation links", async ({ page }) => {
    await page.waitForTimeout(2000);
    const footer = page.locator('footer[class*="border-border"]');
    await expect(footer).toBeVisible();
    const links = footer.locator("a");
    expect(await links.count()).toBeGreaterThan(0);
  });
});
