import { test, expect } from "@playwright/test";

test.describe("Home page visual regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");
  });

  test("hero section renders correctly", async ({ page }) => {
    const hero = page.locator("section").first();
    await expect(hero).toBeVisible();
    await expect(hero.locator("h1")).toBeVisible();
  });

  test("features grid renders 6 cards", async ({ page }) => {
    const features = page.locator("section").nth(1);
    const cards = features.locator("[class*='grid'] > div");
    await expect(cards).toHaveCount(6);
  });

  test("how it works section has 3 steps", async ({ page }) => {
    const steps = page.getByText(/Step \d/);
    await expect(steps).toHaveCount(3);
  });

  test("pricing section shows free and premium tiers", async ({ page }) => {
    const pricingFree = page.getByText("Free");
    const pricingPremium = page.getByText("Premium");
    await expect(pricingFree).toBeVisible();
    await expect(pricingPremium).toBeVisible();
  });

  test("testimonials section has 3 cards", async ({ page }) => {
    const testimonials = page.locator("section").filter({ hasText: "Trusted by Matric" });
    const cards = testimonials
      .locator("[class*='rounded']")
      .filter({ hasText: /Testimonial|Thandi|Sipho|Lerato/i });
    await expect(cards).toHaveCount(3);
  });

  test("footer contains navigation links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    const links = footer.locator("a");
    expect(await links.count()).toBeGreaterThan(5);
  });
});
