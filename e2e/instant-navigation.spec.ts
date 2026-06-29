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

  test("learn category page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const learnLink = page.locator("nav a[href*='/learn']").first();
    await expect(learnLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await learnLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/learn/, { timeout: 15000 });
  });

  test("practice category page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const practiceLink = page.locator("nav a[href*='/practice']").first();
    await expect(practiceLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await practiceLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/practice/, { timeout: 15000 });
  });

  test("tools category page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const toolsLink = page.locator("nav a[href*='/tools']").first();
    await expect(toolsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await toolsLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/tools/, { timeout: 15000 });
  });

  test("progress category page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const progressLink = page.locator("nav a[href*='/progress']").first();
    await expect(progressLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await progressLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/progress/, { timeout: 15000 });
  });

  test("lessons page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const lessonsLink = page.locator("nav a[href*='/lessons']").first();
    await expect(lessonsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await lessonsLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/lessons/, { timeout: 15000 });
  });

  test("pronunciation page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const pronunciationLink = page.locator("nav a[href*='/pronunciation']").first();
    await expect(pronunciationLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await pronunciationLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/pronunciation/, { timeout: 15000 });
  });

  test("exams page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const examsLink = page.locator("nav a[href*='/exams']").first();
    await expect(examsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await examsLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/exams/, { timeout: 15000 });
  });

  test("past-papers page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const pastPapersLink = page.locator("nav a[href*='/past-papers']").first();
    await expect(pastPapersLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await pastPapersLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/past-papers/, { timeout: 15000 });
  });

  test("chat page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const chatLink = page.locator("nav a[href*='/chat']").first();
    await expect(chatLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await chatLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/chat/, { timeout: 15000 });
  });

  test("solve page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const solveLink = page.locator("nav a[href*='/solve']").first();
    await expect(solveLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await solveLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/solve/, { timeout: 15000 });
  });

  test("study-guide page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    const studyGuideLink = page.locator("nav a[href*='/study-guide']").first();
    await expect(studyGuideLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await studyGuideLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/en\/study-guide/, { timeout: 15000 });
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
