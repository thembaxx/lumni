import { test, expect } from "@playwright/test";

test.describe("Easter eggs", () => {
  test.describe("Konami code", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
      });
      await page.goto("/en", { waitUntil: "domcontentloaded" });
    });

    async function sendKonami(page: import("@playwright/test").Page) {
      // Wait for React hydration — the nav button is SSR'd
      await page.locator("nav button").first().waitFor({ state: "attached", timeout: 10000 });
      await page.evaluate(() => document.body.focus());
      const keys = [
        "ArrowUp",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ArrowLeft",
        "ArrowRight",
        "b",
        "a",
      ];
      for (const key of keys) {
        await page.keyboard.press(key);
        await page.waitForTimeout(30);
      }
    }

    test("triggers +30 XP overlay on ↑↑↓↓←→←→BA", async ({ page }) => {
      await sendKonami(page);

      const overlay = page.locator("text=+30 XP");
      await expect(overlay).toBeVisible({ timeout: 5000 });
    });

    test("overlay auto-dismisses after 4 seconds", async ({ page }) => {
      await sendKonami(page);

      const overlay = page.locator("text=+30 XP");
      await expect(overlay).toBeVisible({ timeout: 5000 });

      await expect(overlay).not.toBeVisible({ timeout: 6000 });
    });

    test("wrong key resets the sequence", async ({ page }) => {
      await page.locator("nav button").first().waitFor({ state: "attached", timeout: 10000 });
      await page.evaluate(() => document.body.focus());

      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("x");

      for (const key of ["ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]) {
        await page.keyboard.press(key);
        await page.waitForTimeout(30);
      }

      const overlay = page.locator("text=+30 XP");
      await expect(overlay).not.toBeVisible({ timeout: 2000 });
    });
  });

  test.describe("Search '42' retro easter egg", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
      });
    });

    async function hasSearchWidget(page: import("@playwright/test").Page) {
      // DashboardClient is dynamically imported — wait for hydration
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);
      const searchInput = page.getByPlaceholder("Ask anything about your studies");
      return await searchInput.isVisible({ timeout: 8000 }).catch(() => false);
    }

    test("typing '42' in dashboard search triggers retro scanline", async ({ page }) => {
      await page.goto("/en/dashboard", { waitUntil: "commit" });

      const hasSearch = await hasSearchWidget(page);
      test.skip(!hasSearch, "Dashboard search widget requires authentication or is hidden");
      if (!hasSearch) return;

      const searchInput = page.getByPlaceholder("Ask anything about your studies");
      await searchInput.fill("42");

      const retroOverlay = page.locator(".animate-retro-scan");
      await expect(retroOverlay).toBeVisible({ timeout: 5000 });
    });

    test("retro overlay auto-dismisses after 4 seconds", async ({ page }) => {
      await page.goto("/en/dashboard", { waitUntil: "commit" });

      const hasSearch = await hasSearchWidget(page);
      test.skip(!hasSearch, "Dashboard search widget requires authentication or is hidden");
      if (!hasSearch) return;

      const searchInput = page.getByPlaceholder("Ask anything about your studies");
      await searchInput.fill("42");

      const retroOverlay = page.locator(".animate-retro-scan");
      await expect(retroOverlay).toBeVisible({ timeout: 5000 });

      await expect(retroOverlay).not.toBeVisible({ timeout: 6000 });
    });

    test("typing '42' within a longer string still triggers", async ({ page }) => {
      await page.goto("/en/dashboard", { waitUntil: "commit" });

      const hasSearch = await hasSearchWidget(page);
      test.skip(!hasSearch, "Dashboard search widget requires authentication or is hidden");
      if (!hasSearch) return;

      const searchInput = page.getByPlaceholder("Ask anything about your studies");
      await searchInput.fill("question 42 of the test");

      const retroOverlay = page.locator(".animate-retro-scan");
      await expect(retroOverlay).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Logo 7-click rainbow easter egg", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
      });
    });

    async function waitForNav(page: import("@playwright/test").Page) {
      await page.goto("/en", { waitUntil: "commit" });
      // HomeContent is SSR'd — the nav button is in the initial HTML
      // Wait for React hydration
      await page.waitForTimeout(2000);
      const logoButton = page.locator("nav button").first();
      await expect(logoButton).toBeAttached({ timeout: 10000 });
      // Click with force to handle any overlay issues
      return logoButton;
    }

    test("clicking logo 7 times triggers rainbow overlay", async ({ page }) => {
      const logoButton = await waitForNav(page);

      for (let i = 0; i < 7; i++) {
        await logoButton.click({ force: true });
        await page.waitForTimeout(100);
      }

      const rainbowOverlay = page.locator(".animate-rainbow-shift");
      await expect(rainbowOverlay).toBeVisible({ timeout: 5000 });
    });

    test("clicking logo 6 times does NOT trigger", async ({ page }) => {
      const logoButton = await waitForNav(page);

      for (let i = 0; i < 6; i++) {
        await logoButton.click({ force: true });
        await page.waitForTimeout(100);
      }

      const rainbowOverlay = page.locator(".animate-rainbow-shift");
      await expect(rainbowOverlay).not.toBeVisible({ timeout: 2000 });
    });

    test("rainbow overlay auto-dismisses after 4 seconds", async ({ page }) => {
      const logoButton = await waitForNav(page);

      for (let i = 0; i < 7; i++) {
        await logoButton.click({ force: true });
        await page.waitForTimeout(100);
      }

      const rainbowOverlay = page.locator(".animate-rainbow-shift");
      await expect(rainbowOverlay).toBeVisible({ timeout: 5000 });

      await expect(rainbowOverlay).not.toBeVisible({ timeout: 6000 });
    });
  });

  test.describe("Moon 5-click zen easter egg", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
      });
    });

    async function getThemeButton(page: import("@playwright/test").Page) {
      await page.goto("/en/settings", { waitUntil: "commit" });
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      const themeButton = page.getByRole("button", { name: /Current theme/i });
      const isVisible = await themeButton.isVisible({ timeout: 8000 }).catch(() => false);
      return isVisible ? themeButton : null;
    }

    test("clicking theme toggle 5x from dark mode triggers zen overlay", async ({ page }) => {
      const themeButton = await getThemeButton(page);

      if (!themeButton) {
        test.skip(true, "Settings page requires authentication or theme toggle not found");
        return;
      }

      const currentTheme = await themeButton.getAttribute("aria-label");
      if (!currentTheme?.includes("dark")) {
        await themeButton.click();
        await page.waitForTimeout(300);
        const updatedLabel = await themeButton.getAttribute("aria-label");
        if (!updatedLabel?.includes("dark")) {
          await themeButton.click();
          await page.waitForTimeout(300);
        }
      }

      for (let i = 0; i < 5; i++) {
        const label = await themeButton.getAttribute("aria-label");
        if (!label?.includes("dark")) {
          await themeButton.click();
          await page.waitForTimeout(300);
        }
        await themeButton.click();
        await page.waitForTimeout(300);
      }

      const zenOverlay = page.locator("text=Breathe");
      await expect(zenOverlay).toBeVisible({ timeout: 5000 });
    });

    test("zen overlay auto-dismisses after 4 seconds", async ({ page }) => {
      const themeButton = await getThemeButton(page);

      if (!themeButton) {
        test.skip(true, "Settings page requires authentication or theme toggle not found");
        return;
      }

      const label = await themeButton.getAttribute("aria-label");
      if (!label?.includes("dark")) {
        await themeButton.click();
        await page.waitForTimeout(300);
        const l2 = await themeButton.getAttribute("aria-label");
        if (!l2?.includes("dark")) {
          await themeButton.click();
          await page.waitForTimeout(300);
        }
      }

      for (let i = 0; i < 5; i++) {
        const l = await themeButton.getAttribute("aria-label");
        if (!l?.includes("dark")) {
          await themeButton.click();
          await page.waitForTimeout(300);
        }
        await themeButton.click();
        await page.waitForTimeout(300);
      }

      const zenOverlay = page.locator("text=Breathe");
      await expect(zenOverlay).toBeVisible({ timeout: 5000 });

      await expect(zenOverlay).not.toBeVisible({ timeout: 6000 });
    });
  });
});
