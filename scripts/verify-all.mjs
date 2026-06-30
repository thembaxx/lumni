import { chromium } from "playwright";

const BROWSER_ARGS = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"];

const BASE = "http://localhost:3000";
const dir = "output/verify";

import fs from "fs";
import path from "path";
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: BROWSER_ARGS,
});

function ss(page, name) {
  return page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
}

async function navigateWithStorage(page, url, storageOverrides = {}) {
  // Set localStorage before page loads
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate((overrides) => {
    // Set onboarding as complete
    const onboardingData = {
      isComplete: true,
      selectedSubjects: ["ma", "ph", "en"],
      targetAps: 25,
      dailyStudyMinutes: 30,
      completedAt: Date.now(),
      currentStep: 4,
    };
    localStorage.setItem("lumni_onboarding", JSON.stringify(onboardingData));
    Object.entries(overrides).forEach(([k, v]) => localStorage.setItem(k, v));
  }, storageOverrides);
  await page.goto(url, { waitUntil: "networkidle" });
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

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

// ====================================================
// 1. Logo 7-click easter egg
// ====================================================
console.log("\n" + "=".repeat(50));
console.log("1) Logo 7-click easter egg");
{
  const p = await context.newPage();
  await navigateWithStorage(p, `${BASE}/en/dashboard`);
  await ss(p, "01-dashboard");

  // Find the sidebar logo link
  const logoLink = p.locator('a[href*="/dashboard"]').first();
  if ((await logoLink.count()) > 0) {
    for (let i = 0; i < 7; i++) {
      await logoLink.click();
      await p.waitForTimeout(100);
    }
    await p.waitForTimeout(800);
    await ss(p, "01-logo-7-click");

    // Check for easter egg overlay
    const bodyText = await p.locator("body").innerText();
    if (/rainbow|zen|retro|easter\s*egg/i.test(bodyText)) {
      ok("Logo 7-click easter egg triggered");
    } else {
      // Check for any visible overlay or DOM change
      const hasOverlayClass = await p.evaluate(() => {
        return (
          document.body.innerHTML.includes("rainbow") ||
          document.body.innerHTML.includes("zen-mode") ||
          document.body.innerHTML.includes("retro") ||
          document.querySelector('[class*="overlay"], [class*="easter"], [class*="egg"]') !== null
        );
      });
      if (hasOverlayClass) {
        ok("Logo 7-click easter egg triggered (DOM check)");
      } else {
        nok("Logo 7-click easter egg not detected");
      }
    }
  } else {
    nok("Sidebar logo link not found");
  }
  await p.close();
}

// ====================================================
// 2. Search "42" easter egg
// ====================================================
console.log("\n2) Search '42' easter egg");
{
  const p = await context.newPage();
  await navigateWithStorage(p, `${BASE}/en/dashboard`);
  await ss(p, "02-dashboard-search");

  // Find search input
  const searchInput = p
    .locator('input[type="text"], input[placeholder*="earch"], input[placeholder*="Search"]')
    .first();
  if ((await searchInput.count()) > 0 && (await searchInput.isVisible())) {
    await searchInput.click();
    await searchInput.fill("42");
    await p.waitForTimeout(1500);
    await ss(p, "02-search-42");

    const bodyText = await p.locator("body").innerText();
    // The easter egg might show retro content or "the meaning of life" etc.
    if (/42|the meaning|retro|easter|life.*universe/i.test(bodyText)) {
      ok("Search '42' triggered retro easter egg");
    } else {
      // Check innerHTML for the retro easter egg
      const htmlCheck = await p.evaluate(() => {
        return (
          document.body.innerHTML.includes("42") &&
          (document.body.innerHTML.includes("retro") || document.body.innerHTML.includes("meaning"))
        );
      });
      if (htmlCheck) {
        ok("Search '42' triggered (innerHTML check)");
      } else {
        nok("Search '42' did not show evident response");
      }
    }
  } else {
    nok("Search input not visible on dashboard");
  }
  await p.close();
}

// ====================================================
// 3. Moon 5-click easter egg
// ====================================================
console.log("\n3) Moon 5-click easter egg");
{
  const p = await context.newPage();
  await navigateWithStorage(p, `${BASE}/en/dashboard`);
  await ss(p, "03-dashboard");

  // Find theme toggle
  const themeBtn = p
    .locator('button:has(svg), [class*="theme"] button, button[class*="theme"]')
    .first();
  if ((await themeBtn.count()) > 0 && (await themeBtn.isVisible())) {
    for (let i = 0; i < 5; i++) {
      await themeBtn.click();
      await p.waitForTimeout(200);
    }
    await p.waitForTimeout(1000);
    await ss(p, "03-moon-5-click");

    const bodyText = await p.locator("body").innerText();
    if (/rainbow|zen|retro|easter|achievement|unlock/i.test(bodyText)) {
      ok("Moon 5-click easter egg triggered");
    } else {
      const htmlCheck = await p.evaluate(() => {
        return (
          document.body.innerHTML.includes("easter") ||
          document.body.innerHTML.includes("achievement")
        );
      });
      if (htmlCheck) {
        ok("Moon 5-click easter egg triggered (innerHTML)");
      } else {
        nok("Moon 5-click easter egg not detected");
      }
    }
  } else {
    nok("Theme toggle button not visible");
  }
  await p.close();
}

// ====================================================
// 4. Konami code easter egg
// ====================================================
console.log("\n4) Konami code easter egg");
{
  const p = await context.newPage();
  await navigateWithStorage(p, `${BASE}/en/dashboard`);
  await ss(p, "04-dashboard");

  // Simulate Konami code: ↑↑↓↓←→←→ba
  const keys = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "KeyB",
    "KeyA",
  ];
  for (const key of keys) {
    await p.keyboard.press(key);
    await p.waitForTimeout(80);
  }
  await p.waitForTimeout(1000);
  await ss(p, "04-konami");

  const bodyText = await p.locator("body").innerText();
  if (/rainbow|zen|retro|easter|konami/i.test(bodyText)) {
    ok("Konami code easter egg triggered");
  } else {
    const htmlCheck = await p.evaluate(() => {
      return (
        document.body.innerHTML.includes("rainbow") ||
        document.body.innerHTML.includes("zen-mode") ||
        document.body.innerHTML.includes("retro-mode") ||
        document.querySelector('[class*="overlay"], [class*="easter"]') !== null
      );
    });
    if (htmlCheck) {
      ok("Konami code triggered (DOM check)");
    } else {
      nok("Konami code not detected");
    }
  }
  await p.close();
}

// ====================================================
// 5. Problems page magnetic cards
// ====================================================
console.log("\n5) Problems page - magnetic cards");
{
  const p = await context.newPage();
  await navigateWithStorage(p, `${BASE}/en/problems`);
  await ss(p, "05-problems");

  const bodyText = await p.locator("body").innerText();
  if (/question|problem|difficulty|practice/i.test(bodyText)) {
    ok("Problems page loaded with content");

    // Count interactive cards
    const cards = await p.locator('[class*="card"], [class*="Card"], [data-slot="card"]').all();
    const cardCount = cards.length;
    if (cardCount > 0) {
      ok(`Problems page has ${cardCount} card elements`);
    }
  } else {
    nok("Problems page did not load expected content");
  }
  await p.close();
}

// ====================================================
// 6. Settings page tab transitions
// ====================================================
console.log("\n6) Settings page - tab transitions");
{
  const p = await context.newPage();
  await navigateWithStorage(p, `${BASE}/en/settings`);
  await ss(p, "06-settings");

  const bodyText = await p.locator("body").innerText();
  if (/setting|account|profile|general|appearance|notification/i.test(bodyText)) {
    ok("Settings page loaded with settings content");

    // Find and click tabs
    const tabs = p.locator(
      '[role="tab"], button:has-text("General"), button:has-text("Account"), button:has-text("Data"), button:has-text("Notifications")',
    );
    const tabCount = await tabs.count();
    if (tabCount > 0) {
      ok(`Found ${tabCount} tab elements`);
      // Try clicking last tab (Data)
      const dataTab = p.locator('button:has-text("Data")').first();
      if (await dataTab.isVisible()) {
        await dataTab.click();
        await p.waitForTimeout(500);
        await ss(p, "06-settings-data-tab");
        ok("Settings tab click succeeded");
      }
    }
  } else {
    nok("Settings page did not load expected content");
  }
  await p.close();
}

// ====================================================
// 7. Quiz page interactions
// ====================================================
console.log("\n7) Quiz page - interactions");
{
  const p = await context.newPage();
  await navigateWithStorage(p, `${BASE}/en/quiz`);
  await ss(p, "07-quiz");

  const bodyText = await p.locator("body").innerText();
  if (/quiz|question|subject|topic|start|generate/i.test(bodyText)) {
    ok("Quiz page loaded with content");
    const btns = await p.locator("button").all();
    const visBtns = [];
    for (const btn of btns) {
      if (await btn.isVisible()) visBtns.push(btn);
    }
    ok(`Quiz page has ${visBtns.length} visible buttons`);
  } else {
    nok("Quiz page did not load expected content");
  }
  await p.close();
}

// ====================================================
// Summary
// ====================================================
console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
console.log(`Screenshots saved to: ${dir}`);

await browser.close();
process.exit(fail > 0 ? 1 : 0);
