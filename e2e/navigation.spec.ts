import { test, expect } from "@playwright/test";

test.describe("View transitions", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  async function waitForBottomNav(page: import("@playwright/test").Page) {
    await page.waitForTimeout(3000);
    // BottomNav is dynamically imported — wait for it to appear
    await expect(page.getByRole("button", { name: /All tools/i })).toBeVisible({ timeout: 15000 });
  }

  test("forward direction set when Tools button clicked from Dashboard", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/dashboard", { waitUntil: "commit" });

    await waitForBottomNav(page);

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
    await page.goto("/en/quiz", { waitUntil: "commit" });

    await waitForBottomNav(page);

    const vtDirection = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('button[aria-label="All tools"]');
      if (!btn) return "NO_BUTTON";
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      return document.documentElement.getAttribute("data-vt-direction");
    });

    expect(vtDirection).toBe("back");
  });
});
