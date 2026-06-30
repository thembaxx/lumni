import { chromium } from "playwright";
import fs from "fs";

const dir = "output/verify";
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });

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
// 1. Logo 7-click on LANDING page (where it's wired)
// ====================================================
console.log("\n1) Logo 7-click easter egg (landing page)");
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await p.screenshot({ path: `${dir}/01-landing.png` });

  // Find the brand logo button in the landing nav
  const brandBtn = p.locator("nav button, nav a").filter({ hasText: "Lumni" }).first();
  if ((await brandBtn.count()) > 0 && (await brandBtn.isVisible())) {
    for (let i = 0; i < 7; i++) {
      await brandBtn.click();
      await p.waitForTimeout(100);
    }
    await p.waitForTimeout(1000);
    await p.screenshot({ path: `${dir}/01-logo-7-click.png` });

    // Check for rainbow easter egg overlay
    const html = await p.locator("body").innerHTML();
    if (html.includes("rainbow") || html.includes("Rainbow") || html.includes("RainbowOverlay")) {
      ok("Logo 7-click triggered rainbow easter egg on landing page");
    } else {
      // Check for overlay element
      const hasEE = await p.evaluate(() => {
        return (
          document.querySelector('[class*="z-\\[9999\\]"]') !== null ||
          document.body.innerHTML.includes("rainbow")
        );
      });
      if (hasEE) ok("Logo 7-click triggered (overlay check)");
      else nok("Logo 7-click not triggered on landing page");
    }
  } else {
    nok("Brand logo button not visible on landing page");
  }
  await p.close();
}

// ====================================================
// 2. Moon 5-click (clicking from dark mode)
// ====================================================
console.log("\n2) Moon 5-click easter egg");
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await p.evaluate(() => {
    localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    localStorage.setItem("cookie-consent", JSON.stringify({ analytics: true, essential: true }));
    // Force dark mode
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
  });
  await p.goto("http://localhost:3000/en/dashboard", { waitUntil: "networkidle" });

  // Accept cookies
  const acceptAll = p.locator("button").filter({ hasText: "Accept all" }).first();
  if (await acceptAll.isVisible()) await acceptAll.click();
  await p.waitForTimeout(300);

  // Find theme toggle button
  const themeBtn = p
    .locator("button")
    .filter({ hasText: /theme|System|Light|Dark/i })
    .or(p.locator('[aria-label*="theme"], [aria-label*="Theme"]'))
    .first();
  if (await themeBtn.isVisible()) {
    // The theme toggle cycles system→light→dark
    // Starting from dark, first click goes to system (not "moon" leaving)
    // Second click goes to light, third back to dark
    // Each time we cycle THROUGH dark, the count increments
    // So 5 clicks from any state should pass through dark ~2 times
    for (let i = 0; i < 5; i++) {
      await themeBtn.click();
      await p.waitForTimeout(150);
    }
    await p.waitForTimeout(1000);
    await p.screenshot({ path: `${dir}/02-moon-5-click.png` });

    const html = await p.locator("body").innerHTML();
    if (html.includes("zen") || html.includes("Breathe") || html.includes("ZenOverlay")) {
      ok("Moon 5-click triggered zen easter egg");
    } else {
      const hasEE = await p.evaluate(() => {
        return (
          document.querySelector('[class*="z-\\[9999\\]"]') !== null ||
          document.body.innerHTML.includes("Breathe")
        );
      });
      if (hasEE) ok("Moon 5-click triggered (overlay check)");
      else nok("Moon 5-click not triggered");
    }
  } else {
    nok("Theme toggle not visible");
  }
  await p.close();
}

// ====================================================
// 3. Re-verify Konami code
// ====================================================
console.log("\n3) Konami code");
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await p.evaluate(() => {
    localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    localStorage.setItem("cookie-consent", JSON.stringify({ analytics: true, essential: true }));
  });
  await p.goto("http://localhost:3000/en/dashboard", { waitUntil: "networkidle" });
  const acceptBtn = p.locator("button").filter({ hasText: "Accept all" }).first();
  if (await acceptBtn.isVisible()) await acceptBtn.click();
  await p.waitForTimeout(300);

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
  if (html.includes("Secret Mode") || html.includes("30 XP")) {
    ok("Konami code triggered (+30 XP overlay)");
  } else {
    const overlay = await p.evaluate(
      () => document.querySelector('[class*="z-\\[9999\\]"]') !== null,
    );
    if (overlay) ok("Konami code triggered (overlay)");
    else nok("Konami code not triggered");
  }
  await p.close();
}

// ====================================================
// 4. Re-verify Search "42"
// ====================================================
console.log("\n4) Search '42'");
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await p.evaluate(() => {
    localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    localStorage.setItem("cookie-consent", JSON.stringify({ analytics: true, essential: true }));
  });
  await p.goto("http://localhost:3000/en/dashboard", { waitUntil: "networkidle" });
  const acceptBtn = p.locator("button").filter({ hasText: "Accept all" }).first();
  if (await acceptBtn.isVisible()) await acceptBtn.click();
  await p.waitForTimeout(300);

  await p.waitForTimeout(4500); // wait for konami overlay to clear
  await p.goto("http://localhost:3000/en/dashboard", { waitUntil: "networkidle" });
  await p.waitForTimeout(300);

  const searchInput = p.locator('input[placeholder*="Ask anything"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill("42");
    await p.waitForTimeout(800);

    const html = await p.locator("body").innerHTML();
    if (html.includes("retro-scan") || html.includes("repeating-linear-gradient")) {
      ok("Search '42' triggered retro overlay");
    } else {
      nok("Search '42' not triggered");
    }
  } else {
    nok("Search input not visible");
  }
  await p.close();
}

console.log(`\nResults: ${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail > 0 ? 1 : 0);
