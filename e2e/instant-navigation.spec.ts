import { test, expect } from "@playwright/test";
import { instant } from "@next/playwright";

test.describe("Instant Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  test("dashboard shell appears instantly on navigation", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const quizLink = page.locator("a[href*='/quiz']").first();
    await expect(quizLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await quizLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/quiz/, { timeout: 15000 });
    await expect(page.locator("main")).toBeVisible();
  });

  test("flashcard page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const flashcardsLink = page.locator("a[href*='/flashcards']").first();
    await expect(flashcardsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await flashcardsLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/flashcards/, { timeout: 15000 });
  });

  test("settings page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const settingsLink = page.locator("a[href='/settings']").first();
    await expect(settingsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await settingsLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/settings$/, { timeout: 15000 });
  });

  test("back navigation from quiz to dashboard is instant", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const quizLink = page.locator("a[href*='/quiz']").first();
    await expect(quizLink).toBeVisible({ timeout: 10000 });
    await quizLink.click({ force: true });
    await page.waitForURL(/\/quiz/, { timeout: 15000 });

    await instant(page, async () => {
      await page.goBack();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("exam-dates page shell appears instantly", async ({ page }) => {
    await page.goto("/exam-dates", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/exam-dates/, { timeout: 10000 });
  });

  test("bookmarks page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const bookmarksLink = page.locator("a[href*='/bookmarks']").first();
    await expect(bookmarksLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await bookmarksLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/bookmarks/, { timeout: 15000 });
  });

  test("review page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const reviewLink = page.locator("a[href*='/review']").first();
    await expect(reviewLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await reviewLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/review/, { timeout: 15000 });
  });

  test("study-plan page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const studyPlanLink = page.locator("a[href*='/study-plan']").first();
    await expect(studyPlanLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await studyPlanLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/study-plan/, { timeout: 15000 });
  });

  test("search page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const searchLink = page.locator("a[href*='/search']").first();
    await expect(searchLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await searchLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/search/, { timeout: 15000 });
  });

  test("problems page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const problemsLink = page.locator("a[href*='/problems']").first();
    await expect(problemsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await problemsLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/problems/, { timeout: 15000 });
  });

  test("stories page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const storiesLink = page.locator("a[href*='/stories']").first();
    await expect(storiesLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await storiesLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/stories/, { timeout: 15000 });
  });

  test("learn category page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const learnLink = page.locator("a[href*='/learn']").first();
    await expect(learnLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await learnLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/learn/, { timeout: 15000 });
  });

  test("practice category page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const practiceLink = page.locator("a[href*='/practice']").first();
    await expect(practiceLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await practiceLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/practice/, { timeout: 15000 });
  });

  test("tools category page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const toolsLink = page.locator("a[href*='/tools']").first();
    await expect(toolsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await toolsLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/tools/, { timeout: 15000 });
  });

  test("progress category page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const progressLink = page.locator("a[href*='/progress']").first();
    await expect(progressLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await progressLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/progress/, { timeout: 15000 });
  });

  test("lessons page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const lessonsLink = page.locator("a[href*='/lessons']").first();
    await expect(lessonsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await lessonsLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/lessons/, { timeout: 15000 });
  });

  test("pronunciation page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const pronunciationLink = page.locator("a[href*='/pronunciation']").first();
    await expect(pronunciationLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await pronunciationLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/pronunciation/, { timeout: 15000 });
  });

  test("exams page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const examsLink = page.locator("a[href*='/exams']").first();
    await expect(examsLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await examsLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/exams/, { timeout: 15000 });
  });

  test("past-papers page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const pastPapersLink = page.locator("a[href*='/past-papers']").first();
    await expect(pastPapersLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await pastPapersLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/past-papers/, { timeout: 15000 });
  });

  test("chat page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const chatLink = page.locator("a[href*='/chat']").first();
    await expect(chatLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await chatLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/chat/, { timeout: 15000 });
  });

  test("solve page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const solveLink = page.locator("a[href*='/solve']").first();
    await expect(solveLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await solveLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/solve/, { timeout: 15000 });
  });

  test("study-guide page shell appears instantly", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });
    const studyGuideLink = page.locator("a[href*='/study-guide']").first();
    await expect(studyGuideLink).toBeVisible({ timeout: 10000 });

    await instant(page, async () => {
      await studyGuideLink.click();
      await expect(page.locator("[data-slot='skeleton']").first()).toBeVisible();
    });

    await expect(page).toHaveURL(/\/study-guide/, { timeout: 15000 });
  });

  test("quiz and settings pages load with shell", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });

    await page.goto("/quiz", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible({ timeout: 5000 });

    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible({ timeout: 5000 });
  });
});
