import { chromium } from "playwright";
import fs from "fs";

const dir = "output/verify";
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:3000/onboarding", { waitUntil: "networkidle" });

// Select Mathematics
const mathLabel = page.locator("span, div, label", { hasText: "Mathematics" }).first();
await mathLabel.waitFor({ state: "visible", timeout: 5000 });
await mathLabel.click();
await page.waitForTimeout(500);

// Click Continue
const continueBtn = page.locator("button", { hasText: "Continue" }).first();
if (await continueBtn.isVisible()) {
  await continueBtn.click();
  await page.waitForTimeout(3000);
  console.log("Step 1 URL:", page.url());
  await page.screenshot({ path: `${dir}/onboarding-step2.png` });
}

// If there's a second step, try to finish
const finishBtn = page.locator("button", { hasText: /Finish|Continue|Dashboard|Next/ }).first();
if (await finishBtn.isVisible()) {
  const text = await finishBtn.innerText();
  console.log("Clicking:", text);
  await finishBtn.click();
  await page.waitForTimeout(3000);
}

const finalUrl = page.url();
const bodyText = await page.locator("body").innerText();
console.log("Final URL:", finalUrl);
console.log("Body preview:", bodyText.substring(0, 800));

await page.screenshot({ path: `${dir}/onboarding-complete.png` });
await browser.close();
