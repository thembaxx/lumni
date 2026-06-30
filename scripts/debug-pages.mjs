import { chromium } from "playwright";
import fs from "fs";

const dir = "output/verify";
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Check landing at root
await p.goto("http://localhost:3000", { waitUntil: "networkidle" });
await p.screenshot({ path: `${dir}/debug-root.png` });
console.log("Root URL:", p.url());
console.log("Root title:", await p.title());
const rootText = await p.locator("body").innerText();
console.log("Root text:", rootText.substring(0, 500));

// Check /en
await p.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
await p.screenshot({ path: `${dir}/debug-en.png` });
console.log("\n/en URL:", p.url());
console.log("/en title:", await p.title());
const enText = await p.locator("body").innerText();
console.log("/en text:", enText.substring(0, 500));

// Check landing with onboarding bypass
await p.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await p.evaluate(() => {
  localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
  localStorage.setItem("cookie-consent", JSON.stringify({ analytics: true, essential: true }));
});
await p.goto("http://localhost:3000", { waitUntil: "networkidle" });
await p.screenshot({ path: `${dir}/debug-root-onboarded.png` });
console.log("\nRoot (onboarded) URL:", p.url());
const rootOnbText = await p.locator("body").innerText();
console.log("Root (onboarded) text:", rootOnbText.substring(0, 500));

// Check /en with onboarding bypass + cookies
await p.evaluate(() => {
  localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
  localStorage.setItem("cookie-consent", JSON.stringify({ analytics: true, essential: true }));
});
await p.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
await p.screenshot({ path: `${dir}/debug-en-onboarded.png` });
console.log("\n/en (onboarded) URL:", p.url());
const enOnbText = await p.locator("body").innerText();
console.log("/en (onboarded) text:", enOnbText.substring(0, 500));

await browser.close();
