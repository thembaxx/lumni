import { test, expect } from "@playwright/test";

test.describe("Cookie consent banner", () => {
  test.beforeEach(async ({ page }) => {
    // Bypass onboarding redirect so the landing page renders with cookie banner
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
    await page.goto("/en", { waitUntil: "load" });
    await page.waitForTimeout(1000);
  });

  test("cookie banner is visible on first visit", async ({ page }) => {
    const banner = page.getByText("We respect your privacy");
    await expect(banner).toBeVisible({ timeout: 10000 });
  });

  test("cookie settings dialog opens from banner", async ({ page }) => {
    await page.getByRole("button", { name: "Cookie settings" }).click({ force: true });
    const dialog = page.getByText("Choose which cookies you want to allow.");
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test("essential only dismisses the banner", async ({ page }) => {
    await page.getByRole("button", { name: "Essential only" }).click({ force: true });
    const banner = page.getByText("We respect your privacy");
    await expect(banner).not.toBeVisible({ timeout: 5000 });
  });

  test("accept analytics dismisses the banner", async ({ page }) => {
    await page.getByRole("button", { name: "Accept analytics" }).click({ force: true });
    const banner = page.getByText("We respect your privacy");
    await expect(banner).not.toBeVisible({ timeout: 5000 });
  });

  test("accept all dismisses the banner", async ({ page }) => {
    await page.getByRole("button", { name: "Accept all" }).click({ force: true });
    const banner = page.getByText("We respect your privacy");
    await expect(banner).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe("Cookie settings dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  test("shows category switches and save button", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load" });
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Cookie settings" }).click({ force: true });

    await expect(page.getByRole("heading", { name: "Cookie Settings" })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("switch")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Save preferences" })).toBeVisible();
  });

  test("save preferences dismisses whole banner", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load" });
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Cookie settings" }).click({ force: true });
    await page.getByRole("button", { name: "Save preferences" }).click({ force: true });

    const banner = page.getByText("We respect your privacy");
    await expect(banner).not.toBeVisible({ timeout: 5000 });
  });
});
