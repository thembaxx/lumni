import { test, expect, type Page } from "@playwright/test";
import { instant } from "@next/playwright";

const pages = [
  { route: "/en/quiz", name: "quiz" },
  { route: "/en/flashcards", name: "flashcards" },
  { route: "/en/settings", name: "settings" },
  { route: "/en/exam-dates", name: "exam-dates" },
  { route: "/en/bookmarks", name: "bookmarks" },
  { route: "/en/review", name: "review" },
  { route: "/en/study-plan", name: "study-plan" },
  { route: "/en/search", name: "search" },
  { route: "/en/problems", name: "problems" },
  { route: "/en/stories", name: "stories" },
  { route: "/en/learn", name: "learn" },
  { route: "/en/practice", name: "practice" },
  { route: "/en/tools", name: "tools" },
  { route: "/en/progress", name: "progress" },
  { route: "/en/lessons", name: "lessons" },
  { route: "/en/pronunciation", name: "pronunciation" },
  { route: "/en/exams", name: "exams" },
  { route: "/en/past-papers", name: "past-papers" },
  { route: "/en/chat", name: "chat" },
  { route: "/en/solve", name: "solve" },
  { route: "/en/study-guide", name: "study-guide" },
];

async function navigateToDashboard(page: Page) {
  await page.goto("/en/dashboard", { waitUntil: "commit" });
  await page.waitForLoadState("networkidle");
}

test.describe("Instant Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  for (const { route, name } of pages) {
    test(`${name} page shell appears instantly on navigation`, async ({ page, baseURL }) => {
      await navigateToDashboard(page);

      await instant(
        page,
        async () => {
          await page.goto(route, { waitUntil: "commit" });
          await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
        },
        { baseURL },
      );

      await expect(page).toHaveURL(new RegExp(route.replace("/en/", "/").replace(/\/$/, "")), {
        timeout: 15000,
      });
    });
  }

  test("back navigation from quiz to dashboard is instant", async ({ page, baseURL }) => {
    await navigateToDashboard(page);
    await page.goto("/en/quiz", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });

    await instant(
      page,
      async () => {
        await page.goBack();
        await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
      },
      { baseURL },
    );

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("exam-dates page shell appears instantly", async ({ page, baseURL }) => {
    await navigateToDashboard(page);

    await instant(
      page,
      async () => {
        await page.goto("/exam-dates", { waitUntil: "commit" });
        await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
      },
      { baseURL },
    );

    await expect(page).toHaveURL(/\/exam-dates/, { timeout: 15000 });
  });

  test("quiz and settings pages load with shell", async ({ page }) => {
    await page.goto("/quiz", { waitUntil: "commit" });
    await expect(page.locator("main")).toBeVisible({ timeout: 10000 });

    await page.goto("/settings", { waitUntil: "commit" });
    await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
  });
});
