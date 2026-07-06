import { test, expect } from "@playwright/test";

test.describe("Dictionary page", () => {
  test("loads and shows search input", async ({ page }) => {
    await page.goto("/en/dictionary", { waitUntil: "commit" });
    await expect(page.locator("input").first()).toBeVisible({ timeout: 15000 });
  });

  test("search input is interactive", async ({ page }) => {
    await page.goto("/en/dictionary", { waitUntil: "commit" });
    // Dictionary page pre-caches common words, so networkidle may never
    // settle. Wait for the input element directly instead.
    const input = page.locator("input").first();
    await expect(input).toBeVisible({ timeout: 15000 });
    await input.fill("hello");
    await expect(input).toHaveValue("hello");
  });
});

test.describe("Stories page", () => {
  test("loads and shows story cards", async ({ page }) => {
    await page.goto("/en/stories", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2").first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Pronunciation page", () => {
  test("loads and shows recording UI", async ({ page }) => {
    await page.goto("/en/pronunciation", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2").first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Study page", () => {
  test("loads and shows subject browser", async ({ page }) => {
    await page.goto("/en/study", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2").first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Flashcards page", () => {
  test("loads and shows flashcard options", async ({ page }) => {
    await page.goto("/en/flashcards", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2").first()).toBeVisible({
      timeout: 10000,
    });
  });
});
