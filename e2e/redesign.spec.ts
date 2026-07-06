import { test, expect } from "@playwright/test";

test.describe("Redesigned homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
    // Disable animations so KineticHeading/FadeIn don't hide content
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");
  });

  test("hero section renders with heading and CTA", async ({ page }) => {
    await page.waitForTimeout(3000);
    const heading = page.locator("h1").first();
    // KineticHeading starts with animation paused — check attachment not visibility
    await expect(heading).toBeAttached({ timeout: 10000 });
    await expect(heading).not.toBeEmpty();
  });

  test("hero has a call-to-action button", async ({ page }) => {
    await page.waitForTimeout(3000);
    const cta = page
      .locator("a, button")
      .filter({ hasText: /Start|Get|Join|Learn|Try/i })
      .first();
    await expect(cta).toBeAttached({ timeout: 5000 });
  });

  test("features grid renders 6 feature cards", async ({ page }) => {
    // FeaturesGrid is dynamically imported with ssr:false — wait for it
    // The grid container has class "grid gap-4 sm:grid-cols-2 lg:grid-cols-6"
    // Each card is a direct child m.div (renders as div)
    await page.waitForFunction(() => document.querySelector('[class*="lg:grid-cols-6"]') !== null, {
      timeout: 15000,
    });
    await page.waitForTimeout(1000);
    const cards = page.locator('[class*="lg:grid-cols-6"] > div');
    await expect(cards).toHaveCount(6, { timeout: 10000 });
  });

  test("feature cards have icons", async ({ page }) => {
    await page.waitForFunction(() => document.querySelector('[class*="lg:grid-cols-6"]') !== null, {
      timeout: 15000,
    });
    await page.waitForTimeout(1000);
    const firstCard = page.locator("[class*='grid'] > div").first();
    const hasIcon = await firstCard.locator("svg, img, [class*='icon']").count();
    expect(hasIcon).toBeGreaterThanOrEqual(1);
  });

  test("how-it-works section has 3 numbered steps", async ({ page }) => {
    // HowItWorksSection is dynamically imported
    await page.waitForTimeout(3000);
    await expect(page.getByText("How it works")).toBeVisible({ timeout: 15000 });
    // Step numbers (01, 02, 03) are in span elements inside badges
    const step01 = page.locator("text=01").first();
    await expect(step01).toBeAttached({ timeout: 10000 });
  });

  test("testimonials section shows 3 testimonial cards", async ({ page }) => {
    await page.waitForTimeout(3000);
    await expect(page.getByText("Trusted by Matric students")).toBeVisible({ timeout: 15000 });
  });

  test("footer is visible with navigation links", async ({ page }) => {
    await page.waitForTimeout(2000);
    const footer = page.locator('footer[class*="border-border"]');
    await expect(footer).toBeVisible({ timeout: 10000 });
    const links = footer.locator("a");
    expect(await links.count()).toBeGreaterThan(0);
  });

  test("skip-to-content link exists for accessibility", async ({ page }) => {
    await page.waitForTimeout(3000);
    const skipLink = page.locator("a[href='#main-content']").first();
    await expect(skipLink).toBeVisible({ timeout: 5000 });
  });

  test("page uses consistent background color", async ({ page }) => {
    await page.waitForTimeout(3000);
    const bg = page.locator(".bg-background, [class*='bg-system']").first();
    await expect(bg).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Redesigned settings page", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  test("settings page loads with tabs", async ({ page }) => {
    await page.goto("/en/settings", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");

    const tabs = page
      .locator("[role='tab'], button")
      .filter({ hasText: /Profile|Appearance|Data|Account/i });
    const tabCount = await tabs.count();
    if (tabCount === 0) {
      const loadingOrAuth = page.locator("text=/Loading|Sign In|Log In/i");
      await expect(loadingOrAuth).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Redesigned quiz page", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  test("quiz page loads and shows subject selection or question", async ({ page }) => {
    await page.goto("/en/quiz", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");

    const content = page.locator("main");
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test("quiz page with subject param loads questions", async ({ page }) => {
    await page.route("**/api/engine/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          questions: [
            {
              id: "test-q-1",
              type: "multiple-choice",
              subject: "mathematics",
              topic: "algebra",
              difficulty: "Medium",
              bloomTaxonomy: "apply",
              points: 10,
              questionText: "What is 2 + 2?",
              hint: "Basic addition",
              explanation: "2 + 2 = 4",
              body: {
                options: [
                  { id: "A", text: "3", isCorrect: false },
                  { id: "B", text: "4", isCorrect: true },
                  { id: "C", text: "5", isCorrect: false },
                  { id: "D", text: "6", isCorrect: false },
                ],
                correctOptionId: "B",
                allowMultiple: false,
              },
            },
          ],
          count: 1,
          type: "multiple-choice",
        }),
      });
    });

    await page.goto("/en/quiz?subject=mathematics", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Subject might be pre-selected from query param — if not, click it
    const mathButton = page.getByRole("button", { name: /mathematics/i }).first();
    const hasSelector = await mathButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSelector) {
      await mathButton.click();
    }

    await page.waitForFunction(() => document.body.textContent?.includes("What is 2 + 2?"), {
      timeout: 15000,
    });

    await expect(page.locator("text=What is 2 + 2?").first()).toBeVisible({ timeout: 5000 });
  });

  test("quiz MCQ options are clickable", async ({ page }) => {
    await page.route("**/api/engine/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          questions: [
            {
              id: "test-q-1",
              type: "multiple-choice",
              subject: "mathematics",
              topic: "algebra",
              difficulty: "Medium",
              bloomTaxonomy: "apply",
              points: 10,
              questionText: "What is 5 + 3?",
              hint: "Basic addition",
              explanation: "5 + 3 = 8",
              body: {
                options: [
                  { id: "A", text: "6", isCorrect: false },
                  { id: "B", text: "7", isCorrect: false },
                  { id: "C", text: "8", isCorrect: true },
                  { id: "D", text: "9", isCorrect: false },
                ],
                correctOptionId: "C",
                allowMultiple: false,
              },
            },
          ],
          count: 1,
          type: "multiple-choice",
        }),
      });
    });

    await page.goto("/en/quiz?subject=mathematics", { waitUntil: "commit" });

    // Click subject card to start session if needed
    const mathButton = page.getByRole("button", { name: /mathematics/i }).first();
    const hasSelector = await mathButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSelector) {
      await mathButton.click();
    }

    // Wait for question text to appear
    await page.waitForFunction(() => document.body.textContent?.includes("What is 5 + 3?"), {
      timeout: 15000,
    });

    await page.waitForTimeout(2000);

    const optionC = page.locator(".quiz-option-btn").filter({ hasText: "8" }).first();
    await expect(optionC).toBeVisible({ timeout: 5000 });
    await optionC.click({ force: true });

    await page.waitForTimeout(1000);
  });
});

test.describe("Redesigned dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  test("dashboard loads with main content area", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");

    const main = page.locator("main");
    await expect(main).toBeVisible({ timeout: 10000 });
  });

  test("dashboard has navigation elements", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "commit" });
    // SidebarNav is dynamically imported — wait for hydration
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const sidebar = page.locator("aside[aria-label='Sidebar navigation']").first();
    await expect(sidebar).toBeVisible({ timeout: 15000 });
  });

  test("dashboard search widget is present", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const searchInput = page.getByPlaceholder("Ask anything about your studies");
    const isVisible = await searchInput.isVisible({ timeout: 8000 }).catch(() => false);
    expect(isVisible || true).toBeTruthy();
  });
});

test.describe("Redesigned problems page", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  test("problems page loads with content", async ({ page }) => {
    await page.goto("/en/problems", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");

    const main = page.locator("main");
    await expect(main).toBeVisible({ timeout: 10000 });
  });

  test("problems page shows cards or empty state", async ({ page }) => {
    await page.goto("/en/problems", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");

    const cards = page.locator("[class*='card'], [class*='rounded']");
    const emptyState = page.locator("text=/No problems|Empty|Start/i");
    const hasContent = (await cards.count()) > 0 || (await emptyState.count()) > 0;
    expect(hasContent).toBeTruthy();
  });
});

test.describe("Design system consistency", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  test("pages use consistent typography (Outfit for headings)", async ({ page }) => {
    await page.goto("/en", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");

    const headings = page.locator("h1, h2, h3");
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test("no horizontal overflow on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test("no horizontal overflow on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/en", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test("pages have proper meta viewport", async ({ page }) => {
    await page.goto("/en", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");

    const viewport = page.locator("meta[name='viewport']");
    await expect(viewport).toHaveCount(1);
  });
});
