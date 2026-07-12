import { test, expect } from "@playwright/test";

const COOKIE_BANNER_TEXT = "We respect your privacy";
const SETTINGS_DESC = "Choose which cookies you want to allow.";

async function clickCookieButton(page: import("@playwright/test").Page, name: string) {
  await page.evaluate((n) => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === n);
    if (btn) btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, name);
}

async function setup(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
  });
  await page.goto("/en", { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
}

test.describe("Cookie consent banner", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  test("cookie banner is visible on first visit", async ({ page }) => {
    await expect(page.getByText(COOKIE_BANNER_TEXT)).toBeVisible({ timeout: 10000 });
  });

  test("cookie settings dialog opens from banner", async ({ page }) => {
    await clickCookieButton(page, "Cookie settings");
    await expect(page.getByText(SETTINGS_DESC)).toBeVisible({ timeout: 5000 });
  });

  test("essential only dismisses the banner", async ({ page }) => {
    await clickCookieButton(page, "Essential only");
    await expect(page.getByText(COOKIE_BANNER_TEXT)).not.toBeVisible({ timeout: 5000 });
  });

  test("accept analytics dismisses the banner", async ({ page }) => {
    await clickCookieButton(page, "Accept analytics");
    await expect(page.getByText(COOKIE_BANNER_TEXT)).not.toBeVisible({ timeout: 5000 });
  });

  test("accept all dismisses the banner", async ({ page }) => {
    await clickCookieButton(page, "Accept all");
    await expect(page.getByText(COOKIE_BANNER_TEXT)).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe("Cookie settings dialog", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  test("shows category switches and save button", async ({ page }) => {
    await clickCookieButton(page, "Cookie settings");
    await expect(page.getByRole("heading", { name: "Cookie Settings" })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("switch")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Save preferences" })).toBeVisible();
  });

  test("save preferences dismisses whole banner", async ({ page }) => {
    await clickCookieButton(page, "Cookie settings");
    await clickCookieButton(page, "Save preferences");
    await expect(page.getByText(COOKIE_BANNER_TEXT)).not.toBeVisible({ timeout: 5000 });
  });
});
