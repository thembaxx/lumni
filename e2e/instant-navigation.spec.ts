import { test, expect } from "@playwright/test";
import { instant } from "@next/playwright";

test.describe("Instant Navigation", () => {
  test("dashboard shell appears instantly on navigation", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });

    const quizLink = page.locator("nav a[href*='/quiz']").first();
    await expect(quizLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await quizLink.click();
      await expect(page.locator("main")).toBeVisible();
    });
  });

  test("flashcard page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });

    const flashcardsLink = page.locator("nav a[href*='/flashcards']").first();
    await expect(flashcardsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await flashcardsLink.click();
      await expect(page.locator("main")).toBeVisible();
    });
  });

  test("study page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });

    const studyLink = page.locator("nav a[href*='/study']").first();
    await expect(studyLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await studyLink.click();
      await expect(page.locator("main")).toBeVisible();
    });
  });

  test("settings page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });

    const settingsLink = page.locator("nav a[href*='/settings']").first();
    await expect(settingsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await settingsLink.click();
      await expect(page.locator("main")).toBeVisible();
    });
  });

  test("back navigation from quiz to dashboard is instant", async ({ page }) => {
    await page.goto("/en/quiz", { waitUntil: "networkidle" });

    const dashboardLink = page.locator("nav a[href*='/dashboard']").first();
    await expect(dashboardLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await dashboardLink.click();
      await expect(page.locator("main")).toBeVisible();
    });
  });

  test("exam-dates page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });

    const examDatesLink = page.locator("nav a[href*='/exam-dates']").first();
    await expect(examDatesLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await examDatesLink.click();
      await expect(page.locator("main")).toBeVisible();
    });
  });

  test("bookmarks page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });

    const bookmarksLink = page.locator("nav a[href*='/bookmarks']").first();
    await expect(bookmarksLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await bookmarksLink.click();
      await expect(page.locator("main")).toBeVisible();
    });
  });

  test("review page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });

    const reviewLink = page.locator("nav a[href*='/review']").first();
    await expect(reviewLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await reviewLink.click();
      await expect(page.locator("main")).toBeVisible();
    });
  });

  test("multi-hop navigation remains instant (dashboard → quiz → settings)", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });

    const quizLink = page.locator("nav a[href*='/quiz']").first();
    await expect(quizLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await quizLink.click();
      await expect(page.locator("main")).toBeVisible();
    });

    const settingsLink = page.locator("nav a[href*='/settings']").first();
    await expect(settingsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await settingsLink.click();
      await expect(page.locator("main")).toBeVisible();
    });
  });
});
