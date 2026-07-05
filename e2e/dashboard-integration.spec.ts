import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  test("loads and shows main sections", async ({ page }) => {
    await page.goto("/en", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main#main-content")).toBeVisible({
      timeout: 15000,
    });
  });

  test("has navigation sidebar or bottom nav", async ({ page }) => {
    await page.goto("/en", { waitUntil: "domcontentloaded" });
    const sidebar = page.locator("aside[aria-label='Sidebar navigation']").first();
    await expect(sidebar).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Vocabulary flashcard mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  test("loads with mode=vocabulary param", async ({ page }) => {
    await page.goto("/en/flashcards?mode=vocabulary", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main#main-content")).toBeVisible({
      timeout: 15000,
    });
  });
});

test.describe("Story reader", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  test("story library loads", async ({ page }) => {
    await page.goto("/en/stories", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main#main-content")).toBeVisible({
      timeout: 15000,
    });
  });
});
