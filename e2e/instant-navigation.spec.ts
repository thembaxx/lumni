import { test, expect } from "@playwright/test";
import { instant } from "@next/playwright";

test.describe("Instant Navigation", () => {
  test("dashboard shell appears instantly on navigation", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const quizLink = page.locator("nav a[href*='/quiz']").first();
    await expect(quizLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await quizLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/quiz/, { timeout: 15000 });
    await expect(page.locator("main")).toBeVisible();
  });

  test("flashcard page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const flashcardsLink = page.locator("nav a[href*='/flashcards']").first();
    await expect(flashcardsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await flashcardsLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/flashcards/, { timeout: 15000 });
  });

  test("study page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const studyLink = page.locator("nav a[href*='/study']").first();
    await expect(studyLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await studyLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/study(\/|$)/, { timeout: 15000 });
  });

  test("settings page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const settingsLink = page.locator("nav a[href*='/settings']").first();
    await expect(settingsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await settingsLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/settings/, { timeout: 15000 });
  });

  test("back navigation from quiz to dashboard is instant", async ({ page }) => {
    await page.goto("/en/quiz", { waitUntil: "networkidle" });
    const dashboardLink = page.locator("nav a[href*='/dashboard']").first();
    await expect(dashboardLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await dashboardLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 15000 });
  });

  test("exam-dates page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const examDatesLink = page.locator("nav a[href*='/exam-dates']").first();
    await expect(examDatesLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await examDatesLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/exam-dates/, { timeout: 15000 });
  });

  test("bookmarks page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const bookmarksLink = page.locator("nav a[href*='/bookmarks']").first();
    await expect(bookmarksLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await bookmarksLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/bookmarks/, { timeout: 15000 });
  });

  test("review page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const reviewLink = page.locator("nav a[href*='/review']").first();
    await expect(reviewLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await reviewLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/review/, { timeout: 15000 });
  });

  test("study-plan page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const studyPlanLink = page.locator("nav a[href*='/study-plan']").first();
    await expect(studyPlanLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await studyPlanLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/study-plan/, { timeout: 15000 });
  });

  test("search page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const searchLink = page.locator("nav a[href*='/search']").first();
    await expect(searchLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await searchLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/search/, { timeout: 15000 });
  });

  test("problems page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const problemsLink = page.locator("nav a[href*='/problems']").first();
    await expect(problemsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await problemsLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/problems/, { timeout: 15000 });
  });

  test("stories page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const storiesLink = page.locator("nav a[href*='/stories']").first();
    await expect(storiesLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await storiesLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/stories/, { timeout: 15000 });
  });

  test("multi-hop navigation remains instant (dashboard → quiz → settings)", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const quizLink = page.locator("nav a[href*='/quiz']").first();
    await expect(quizLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await quizLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/quiz/, { timeout: 15000 });

    const settingsLink = page.locator("nav a[href*='/settings']").first();
    await expect(settingsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await settingsLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/settings/, { timeout: 15000 });
  });
});
