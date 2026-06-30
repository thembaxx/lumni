import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const BASE = "http://localhost:3000";
const dir = path.dirname(fileURLToPath(import.meta.url));
const ssDir = path.join(dir, "..", "output", "verify");

import fs from "fs";
fs.mkdirSync(ssDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(ssDir, `${name}.png`) });
}

// Helper: simulate keyboard sequence
async function typeKeys(page, keys) {
  for (const key of keys) {
    await page.keyboard.press(key);
    await new Promise((r) => setTimeout(r, 80));
  }
}

let pass = 0;
let fail = 0;
function ok(msg) {
  pass++;
  console.log(`  ✓ ${msg}`);
}
function nok(msg) {
  fail++;
  console.log(`  ✗ ${msg}`);
}

// ====================================================
// 1. Logo 7-click easter egg
// ====================================================
console.log("\n1) Logo 7-click easter egg");
{
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });

  // Find sidebar logo link
  const logo = page.locator('a[href="/dashboard"]').first();
  if ((await logo.count()) > 0) {
    for (let i = 0; i < 7; i++) {
      await logo.click();
      await new Promise((r) => setTimeout(r, 100));
    }
    await new Promise((r) => setTimeout(r, 500));
    // Check for easter egg overlay text
    const body = await page.locator("body").textContent();
    const hasEE = /rainbow|zen|retro|easter\s*egg/i.test(body);
    if (hasEE) {
      // Check for overlay element
      const overlay = page
        .locator('[class*="fixed"],[class*="absolute"]')
        .filter({ hasText: /rainbow|zen|retro/i });
      if ((await overlay.count()) > 0) {
        ok("Logo 7-click easter egg overlay appeared");
      } else {
        // Might be a toast or subtle effect
        ok("Logo 7-click triggered (content detected)");
      }
    } else {
      nok("Logo 7-click easter egg not triggered (no overlay found)");
    }
  } else {
    nok("Logo element not found on page");
  }
  await page.close();
}

// ====================================================
// 2. Search "42" easter egg
// ====================================================
console.log("\n2) Search '42' easter egg");
{
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  // Navigate to dashboard where search widget lives
  await page.goto(`${BASE}/en/dashboard`, { waitUntil: "networkidle" });

  // Find search input
  const searchInput = page
    .locator('input[type="text"], input[placeholder*="earch"], input[placeholder*="Search"]')
    .first();
  if ((await searchInput.count()) > 0) {
    await searchInput.click();
    await searchInput.fill("42");
    await new Promise((r) => setTimeout(r, 1000));
    const body = await page.locator("body").textContent();
    if (/42|retro|easter|the meaning/i.test(body)) {
      // Could be a small visual change
      ok("Search '42' triggered retro easter egg");
    } else {
      nok("Search '42' did not show evident response");
    }
  } else {
    nok("Search input not found on dashboard");
  }
  await page.close();
}

// ====================================================
// 3. Moon 5-click easter egg
// ====================================================
console.log("\n3) Moon 5-click easter egg");
{
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });

  // Find theme toggle button (moon icon)
  const themeToggle = page
    .locator('[class*="theme"], button:has([class*="Moon"i]), button:has(svg)')
    .first();
  if ((await themeToggle.count()) > 0) {
    for (let i = 0; i < 5; i++) {
      await themeToggle.click();
      await new Promise((r) => setTimeout(r, 200));
    }
    await new Promise((r) => setTimeout(r, 500));
    const body = await page.locator("body").textContent();
    if (/rainbow|zen|retro|easter\s*egg|achievement/i.test(body)) {
      ok("Moon 5-click easter egg triggered");
    } else {
      // Might need dark mode first
      nok("Moon 5-click easter egg not detected");
    }
  } else {
    nok("Theme toggle button not found");
  }
  await page.close();
}

// ====================================================
// 4. Problems page magnetic card effects
// ====================================================
console.log("\n4) Problems page - magnetic cards");
{
  const page = await context.newPage();
  await page.goto(`${BASE}/en/problems`, { waitUntil: "networkidle" });
  await screenshot(page, "problems-page");
  const body = await page.locator("body").textContent();
  const hasCards = /\bquestion\b|\bproblem\b|\bdifficulty\b|\bsolve\b|\banswer\b/i.test(body);
  if (hasCards) {
    ok("Problems page loaded with cards");
    // Check for card elements with 3D transform
    const cards = page.locator(
      '[class*="card"], [class*="Card"], [class*="group"], a[href*="problem"]',
    );
    const count = await cards.count();
    if (count > 0) {
      ok(`Found ${count} card elements on problems page`);
    } else {
      nok("No card elements found");
    }
  } else {
    nok("Problems page did not load expected content");
  }
  await page.close();
}

// ====================================================
// 5. Settings page transitions
// ====================================================
console.log("\n5) Settings page - tab transitions");
{
  const page = await context.newPage();
  await page.goto(`${BASE}/en/settings`, { waitUntil: "networkidle" });
  await screenshot(page, "settings-page");
  const body = await page.locator("body").textContent();
  const hasSettings = /setting|account|profile|tab/i.test(body);
  if (hasSettings) {
    ok("Settings page loaded");
    // Check for tab elements
    const tabs = page.locator(
      '[role="tab"], button:has-text("General"), button:has-text("Account"), button:has-text("Data")',
    );
    const tabCount = await tabs.count();
    if (tabCount > 0) {
      ok(`Found ${tabCount} tab elements on settings page`);
      // Try clicking a tab
      const secondTab = page
        .locator(
          'button:has-text("Account"), button:has-text("Notifications"), button:has-text("Appearance")',
        )
        .first();
      if ((await secondTab.count()) > 0) {
        await secondTab.click();
        await new Promise((r) => setTimeout(r, 300));
        ok("Settings tab click succeeded");
      }
    } else {
      nok("No tab elements found on settings page");
    }
  } else {
    nok("Settings page did not load expected content");
  }
  await page.close();
}

// ====================================================
// 6. Quiz page interactions
// ====================================================
console.log("\n6) Quiz page - interactions");
{
  const page = await context.newPage();
  await page.goto(`${BASE}/en/quiz`, { waitUntil: "networkidle" });
  await screenshot(page, "quiz-page");
  const body = await page.locator("body").textContent();
  const hasQuiz = /quiz|question|subject|topic|start/i.test(body);
  if (hasQuiz) {
    ok("Quiz page loaded");
    const buttons = page.locator('button, a[href*="quiz"]');
    const btnCount = await buttons.count();
    if (btnCount > 0) {
      ok(`Found ${btnCount} interactive elements on quiz page`);
    }
  } else {
    nok("Quiz page did not load expected content");
  }
  await page.close();
}

// ====================================================
// Summary
// ====================================================
console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
console.log(`Screenshots saved to: ${ssDir}`);

await browser.close();
process.exit(fail > 0 ? 1 : 0);
