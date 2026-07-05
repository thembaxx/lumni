import { test, expect } from "@playwright/test";

test.describe("View transitions", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  test("forward direction set when Tools button clicked from Dashboard", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const toolsBtn = page.getByRole("button", { name: /All tools/i });
    await expect(toolsBtn).toBeVisible({ timeout: 10000 });

    // Read attribute instantly after click, before any navigation completes
    // Using page.evaluate to click and read in same microtask
    const vtDirection = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('button[aria-label="All tools"]');
      if (!btn) return "NO_BUTTON";
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      return document.documentElement.getAttribute("data-vt-direction");
    });

    expect(vtDirection).toBe("forward");
  });

  test("back direction set when Tools button clicked from Quiz page", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/quiz", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const toolsBtn = page.getByRole("button", { name: /All tools/i });
    await expect(toolsBtn).toBeVisible({ timeout: 10000 });

    const vtDirection = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('button[aria-label="All tools"]');
      if (!btn) return "NO_BUTTON";
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      return document.documentElement.getAttribute("data-vt-direction");
    });

    expect(vtDirection).toBe("back");
  });
});
