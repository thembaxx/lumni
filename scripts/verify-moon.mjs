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

// Moon 5-click - via Settings > Appearance tab
console.log("\nMoon 5-click easter egg (via Settings → Appearance tab)");
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await p.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await p.evaluate(() => {
  localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
  localStorage.setItem("cookie-consent", JSON.stringify({ analytics: true, essential: true }));
  localStorage.setItem("theme", "dark");
});

// Go to settings → appearance tab
await p.goto("http://localhost:3000/en/settings?tab=appearance", { waitUntil: "networkidle" });
await p.screenshot({ path: `${dir}/settings-appearance.png` });

// Accept cookies if visible
const accept = p.locator("button").filter({ hasText: "Accept all" }).first();
if (await accept.isVisible()) await accept.click();
await p.waitForTimeout(300);

// Find the theme toggle - it should be a button with border border-border
const themeBtn = p.locator("button.border\\.border-border").first();
if ((await themeBtn.count()) > 0 && (await themeBtn.isVisible())) {
  // Starting from dark mode, each click goes system→light→dark
  // Dark→System→Light→Dark→System→Light (passes through dark on clicks 1, 4)
  // We need 5 dark passes, so 13 clicks should do it (dark on clicks 1,4,7,10,13)
  for (let i = 0; i < 13; i++) {
    await themeBtn.click();
    await p.waitForTimeout(100);
  }
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${dir}/moon-5-click.png` });

  const html = await p.locator("body").innerHTML();
  if (html.includes("Breathe") || html.includes("zen-ripple")) {
    ok("Moon 5-click triggered zen easter egg");
  } else {
    const overlay = await p.evaluate(() => {
      return document.body.innerHTML.includes("Breathe");
    });
    if (overlay) ok("Moon 5-click triggered");
    else nok("Moon 5-click not triggered");
  }
} else {
  // Try a more general approach - find all buttons and look for the theme one
  const allBtns = await p.locator("button").all();
  let foundTheme = false;
  for (const btn of allBtns) {
    const html = await btn.innerHTML();
    if (html.includes("Moon") || html.includes("Sun") || html.includes("Computer")) {
      foundTheme = true;
      if (await btn.isVisible()) {
        for (let i = 0; i < 13; i++) {
          await btn.click();
          await p.waitForTimeout(100);
        }
        await p.waitForTimeout(1500);
        const bodyHtml = await p.locator("body").innerHTML();
        if (bodyHtml.includes("Breathe")) ok("Moon 5-click triggered");
        else nok("Moon 5-click not triggered");
      }
      break;
    }
  }
  if (!foundTheme) nok("Theme toggle not found on settings appearance tab");
}

await p.close();

// Konami (quick re-check)
console.log("\nKonami code");
const p2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p2.goto("http://localhost:3000/en/dashboard", { waitUntil: "networkidle" });
// Check for the thing
const srOnly = p2.locator('a[href="#main-content"]').first();
await srOnly.waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
const accept2 = p2.locator("button").filter({ hasText: "Accept all" }).first();
if (await accept2.isVisible()) await accept2.click();

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
  await p2.keyboard.press(key);
  await p2.waitForTimeout(80);
}
await p2.waitForTimeout(1000);
const html2 = await p2.locator("body").innerHTML();
if (html2.includes("+30 XP") || html2.includes("Secret Mode")) ok("Konami code triggered");
else nok("Konami code not triggered");
await p2.close();

console.log(`\nResults: ${pass} passed, ${fail} failed`);
await browser.close();
