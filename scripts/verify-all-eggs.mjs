import { chromium } from "playwright";
import fs from "fs";

const dir = "output/verify";
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });
let pass = 0,
  fail = 0;
function ok(m) {
  pass++;
  console.log(`  ✓ ${m}`);
}
function nok(m) {
  fail++;
  console.log(`  ✗ ${m}`);
}

// ====================================================
// 1. Logo 7-click on landing page (/en)
// ====================================================
console.log("\n1) Logo 7-click (landing page /en)");
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000/en", { waitUntil: "domcontentloaded" });
  await p.evaluate(() => {
    localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    localStorage.setItem("cookie-consent", JSON.stringify({ analytics: true, essential: true }));
  });
  await p.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
  await p.screenshot({ path: `${dir}/01-landing-en.png` });

  // Find the brand logo: it's a button with the StarIcon + "lumni" text
  // Based on the source, the button is clickable with handleLogoClick
  const brandBtn = p.locator("nav button, button").filter({ hasText: "lumni" }).first();
  const brandBtnCount = await brandBtn.count();
  console.log(`  Brand buttons with "lumni": ${brandBtnCount}`);

  if (brandBtnCount > 0 && (await brandBtn.isVisible())) {
    for (let i = 0; i < 7; i++) {
      await brandBtn.click({ force: true });
      await p.waitForTimeout(100);
    }
    await p.waitForTimeout(1000);
    await p.screenshot({ path: `${dir}/01-logo-7-click.png` });

    const html = await p.locator("body").innerHTML();
    if (
      html.includes("rainbow-shift") ||
      html.includes("RainbowOverlay") ||
      html.includes("Rainbow")
    ) {
      ok("Logo 7-click triggered rainbow easter egg");
    } else {
      // Check for any overlay
      const overlay = await p.evaluate(() => {
        return document.querySelector('[class*="z-\\[9999\\]"]') !== null;
      });
      if (overlay) ok("Logo 7-click triggered (overlay found)");
      else nok("Logo 7-click not triggered");
    }
  } else {
    nok("Brand button with 'lumni' text not visible");
  }
  await p.close();
}

// ====================================================
// 2. Moon 5-click (on dashboard, starting dark)
// ====================================================
console.log("\n2) Moon 5-click");
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await p.evaluate(() => {
    localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    localStorage.setItem("cookie-consent", JSON.stringify({ analytics: true, essential: true }));
    localStorage.setItem("theme", "dark");
  });
  await p.goto("http://localhost:3000/en/dashboard", { waitUntil: "networkidle" });
  await p.screenshot({ path: `${dir}/02-dashboard-dark.png` });

  // Accept cookies
  const accept = p.locator("button").filter({ hasText: "Accept all" }).first();
  if (await accept.isVisible()) await accept.click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${dir}/02-cookies-accepted.png` });

  // Find theme toggle: look for button with Sun/Moon/Computer icons
  // In the dashboard top nav, there's a LocaleSwitcher and the theme toggle should be somewhere
  const localeSwitcher = p.locator("button").filter({ hasText: "en" });
  const localeCount = await localeSwitcher.count();
  console.log(`  Locale switcher buttons: ${localeCount}`);

  // List all visible buttons with their text/aria
  const visBtns = await p.locator("button:visible").all();
  console.log(`  All visible buttons: ${visBtns.length}`);
  for (const btn of visBtns) {
    const text = (await btn.innerText()).trim().substring(0, 30);
    const aria = (await btn.getAttribute("aria-label")) || "";
    if (aria || text) {
      console.log(`    "${text || "(icon)"}" aria="${aria.substring(0, 40)}"`);
    }
  }

  // Try to find theme toggle by aria-label
  let themeBtn = p.locator('[aria-label*="theme"], [aria-label*="Theme"]').first();
  if ((await themeBtn.count()) === 0 || !(await themeBtn.isVisible())) {
    // Try finding by icon class
    themeBtn = p
      .locator("button")
      .filter({ has: p.locator('[class*="Moon"i], [class*="Sun"i], [class*="Computer"i]') })
      .first();
  }
  const themeBtnVisible = await themeBtn.isVisible();
  console.log(`  Theme toggle visible: ${themeBtnVisible}`);

  if (themeBtnVisible) {
    // Cycle 5+ times to pass through dark enough times
    // Dark→System→Light→Dark→System→Light (6 clicks = 2 dark passes)
    for (let i = 0; i < 6; i++) {
      await themeBtn.click();
      await p.waitForTimeout(100);
    }
    await p.waitForTimeout(1000);
    await p.screenshot({ path: `${dir}/02-moon-5-click.png` });

    const html = await p.locator("body").innerHTML();
    if (html.includes("Breathe") || html.includes("zen") || html.includes("ZenOverlay")) {
      ok("Moon 5-click triggered zen easter egg");
    } else {
      const overlay = await p.evaluate(() => {
        return (
          document.body.innerHTML.includes("Breathe") ||
          document.querySelector('[class*="z-\\[9999\\]"]') !== null
        );
      });
      if (overlay) ok("Moon 5-click triggered (overlay)");
      else nok("Moon 5-click not triggered");
    }
  } else {
    nok("Theme toggle not found");
  }
  await p.close();
}

// ====================================================
// 3. Konami code (quick re-verify)
// ====================================================
console.log("\n3) Konami code");
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await p.evaluate(() => {
    localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    localStorage.setItem("cookie-consent", JSON.stringify({ analytics: true, essential: true }));
  });
  await p.goto("http://localhost:3000/en/dashboard", { waitUntil: "networkidle" });
  const accept = p.locator("button").filter({ hasText: "Accept all" }).first();
  if (await accept.isVisible()) await accept.click();

  for (const key of [
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
  ]) {
    await p.keyboard.press(key);
    await p.waitForTimeout(80);
  }
  await p.waitForTimeout(1000);

  const html = await p.locator("body").innerHTML();
  if (html.includes("+30 XP") || html.includes("Secret Mode")) ok("Konami code triggered");
  else nok("Konami code not triggered");
  await p.close();
}

// ====================================================
// 4. Search "42"
// ====================================================
console.log("\n4) Search '42'");
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await p.evaluate(() => {
    localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    localStorage.setItem("cookie-consent", JSON.stringify({ analytics: true, essential: true }));
  });
  await p.goto("http://localhost:3000/en/dashboard", { waitUntil: "networkidle" });
  const accept = p.locator("button").filter({ hasText: "Accept all" }).first();
  if (await accept.isVisible()) await accept.click();

  const searchInput = p.locator('input[placeholder*="Ask anything"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill("42");
    await p.waitForTimeout(800);
    const html = await p.locator("body").innerHTML();
    if (html.includes("retro-scan")) ok("Search '42' triggered retro");
    else nok("Search '42' not triggered");
  } else nok("Search input not visible");
  await p.close();
}

console.log(`\nResults: ${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail > 0 ? 1 : 0);
