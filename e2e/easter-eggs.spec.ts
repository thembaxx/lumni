import { test, expect } from "@playwright/test";

test.describe("Easter eggs", () => {
  test.describe("Konami code", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/en", { waitUntil: "networkidle" });
    });

    test("triggers +30 XP overlay on ↑↑↓↓←→←→BA", async ({ page }) => {
      // Dismiss any Next.js error overlay first
      const dismissBtn = page.locator("button:has-text('Dismiss')");
      if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dismissBtn.click();
      }

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
      }

      const overlay = page.locator("text=+30 XP");
      await expect(overlay).toBeVisible({ timeout: 5000 });
    });

    test("overlay auto-dismisses after 4 seconds", async ({ page }) => {
      const dismissBtn = page.locator("button:has-text('Dismiss')");
      if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dismissBtn.click();
      }

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
      }

      const overlay = page.locator("text=+30 XP");
      await expect(overlay).toBeVisible({ timeout: 5000 });

      // Wait for auto-dismiss (4s + buffer)
      await expect(overlay).not.toBeVisible({ timeout: 6000 });
    });

    test("wrong key resets the sequence", async ({ page }) => {
      const dismissBtn = page.locator("button:has-text('Dismiss')");
      if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dismissBtn.click();
      }

      // Partial sequence then wrong key
      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("x"); // Wrong key

      // Complete sequence — should NOT trigger because we reset
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
      }

      // Should NOT show overlay
      const overlay = page.locator("text=+30 XP");
      await expect(overlay).not.toBeVisible({ timeout: 2000 });
    });
  });

  test.describe("Search '42' retro easter egg", () => {
    test("typing '42' in dashboard search triggers retro scanline", async ({ page }) => {
      // Go to dashboard (bypasses onboarding)
      await page.goto("/en/dashboard", { waitUntil: "networkidle" });

      // Wait for search widget to appear
      const searchInput = page.getByPlaceholder("Ask anything about your studies");
      await expect(searchInput).toBeVisible({ timeout: 10000 });

      // Type "42"
      await searchInput.fill("42");

      // Retro scanline overlay should appear (repeating-linear-gradient)
      const retroOverlay = page.locator(".animate-retro-scan");
      await expect(retroOverlay).toBeVisible({ timeout: 5000 });
    });

    test("retro overlay auto-dismisses after 4 seconds", async ({ page }) => {
      await page.goto("/en/dashboard", { waitUntil: "networkidle" });

      const searchInput = page.getByPlaceholder("Ask anything about your studies");
      await expect(searchInput).toBeVisible({ timeout: 10000 });

      await searchInput.fill("42");

      const retroOverlay = page.locator(".animate-retro-scan");
      await expect(retroOverlay).toBeVisible({ timeout: 5000 });

      // Auto-dismiss after 4s + buffer
      await expect(retroOverlay).not.toBeVisible({ timeout: 6000 });
    });

    test("typing '42' within a longer string still triggers", async ({ page }) => {
      await page.goto("/en/dashboard", { waitUntil: "networkidle" });

      const searchInput = page.getByPlaceholder("Ask anything about your studies");
      await expect(searchInput).toBeVisible({ timeout: 10000 });

      await searchInput.fill("question 42 of the test");

      const retroOverlay = page.locator(".animate-retro-scan");
      await expect(retroOverlay).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Logo 7-click rainbow easter egg", () => {
    test("clicking logo 7 times triggers rainbow overlay", async ({ page }) => {
      await page.goto("/en", { waitUntil: "networkidle" });

      // Find the brand button (has the star icon + brand name)
      const logoButton = page.locator("nav button").first();
      await expect(logoButton).toBeVisible({ timeout: 10000 });

      // Click 7 times
      for (let i = 0; i < 7; i++) {
        await logoButton.click();
      }

      // Rainbow overlay should appear
      const rainbowOverlay = page.locator(".animate-rainbow-shift");
      await expect(rainbowOverlay).toBeVisible({ timeout: 5000 });
    });

    test("clicking logo 6 times does NOT trigger", async ({ page }) => {
      await page.goto("/en", { waitUntil: "networkidle" });

      const logoButton = page.locator("nav button").first();
      await expect(logoButton).toBeVisible({ timeout: 10000 });

      // Click 6 times
      for (let i = 0; i < 6; i++) {
        await logoButton.click();
      }

      const rainbowOverlay = page.locator(".animate-rainbow-shift");
      await expect(rainbowOverlay).not.toBeVisible({ timeout: 2000 });
    });

    test("rainbow overlay auto-dismisses after 4 seconds", async ({ page }) => {
      await page.goto("/en", { waitUntil: "networkidle" });

      const logoButton = page.locator("nav button").first();
      await expect(logoButton).toBeVisible({ timeout: 10000 });

      for (let i = 0; i < 7; i++) {
        await logoButton.click();
      }

      const rainbowOverlay = page.locator(".animate-rainbow-shift");
      await expect(rainbowOverlay).toBeVisible({ timeout: 5000 });

      await expect(rainbowOverlay).not.toBeVisible({ timeout: 6000 });
    });
  });

  test.describe("Moon 5-click zen easter egg", () => {
    test("clicking theme toggle 5x from dark mode triggers zen overlay", async ({ page }) => {
      await page.goto("/en/settings", { waitUntil: "networkidle" });

      // Wait for the page to settle
      await page.waitForLoadState("networkidle");

      // Find the theme toggle button
      const themeButton = page.getByRole("button", { name: /Current theme/i });
      const isVisible = await themeButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!isVisible) {
        // Not authenticated — skip this test gracefully
        test.skip(true, "Settings page requires authentication");
        return;
      }

      // Ensure we're in dark mode first
      const currentTheme = await themeButton.getAttribute("aria-label");
      if (!currentTheme?.includes("dark")) {
        // Switch to dark mode first
        await themeButton.click();
        // May need one more click depending on current state
        const updatedLabel = await themeButton.getAttribute("aria-label");
        if (!updatedLabel?.includes("dark")) {
          await themeButton.click();
        }
      }

      // Now click 5 times from dark mode (each click leaves dark, so count matters)
      // The trigger fires when theme === "dark" at click time
      // So we need to switch TO dark, then click to leave dark 5 times
      // Actually: it fires when `theme === "dark"` at time of onClick
      // So click from dark → triggers. Switch back to dark → triggers again.
      for (let i = 0; i < 5; i++) {
        // Ensure we're in dark before clicking
        const label = await themeButton.getAttribute("aria-label");
        if (!label?.includes("dark")) {
          // Click to cycle to dark
          await themeButton.click();
          // Wait for theme to change
          await page.waitForTimeout(200);
        }
        // Now click to leave dark (this triggers the egg)
        await themeButton.click();
        await page.waitForTimeout(200);
      }

      // Zen overlay should appear
      const zenOverlay = page.locator("text=Breathe");
      await expect(zenOverlay).toBeVisible({ timeout: 5000 });
    });

    test("zen overlay auto-dismisses after 4 seconds", async ({ page }) => {
      await page.goto("/en/settings", { waitUntil: "networkidle" });
      await page.waitForLoadState("networkidle");

      const themeButton = page.getByRole("button", { name: /Current theme/i });
      const isVisible = await themeButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!isVisible) {
        test.skip(true, "Settings page requires authentication");
        return;
      }

      // Ensure dark mode, then click 5 times
      const label = await themeButton.getAttribute("aria-label");
      if (!label?.includes("dark")) {
        await themeButton.click();
        await page.waitForTimeout(200);
        const l2 = await themeButton.getAttribute("aria-label");
        if (!l2?.includes("dark")) {
          await themeButton.click();
          await page.waitForTimeout(200);
        }
      }

      for (let i = 0; i < 5; i++) {
        const l = await themeButton.getAttribute("aria-label");
        if (!l?.includes("dark")) {
          await themeButton.click();
          await page.waitForTimeout(200);
        }
        await themeButton.click();
        await page.waitForTimeout(200);
      }

      const zenOverlay = page.locator("text=Breathe");
      await expect(zenOverlay).toBeVisible({ timeout: 5000 });

      await expect(zenOverlay).not.toBeVisible({ timeout: 6000 });
    });
  });
});
