import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Set onboarding as complete via localStorage
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  localStorage.setItem(
    "lumni_onboarding",
    JSON.stringify({
      isComplete: true,
      selectedSubjects: ["ma", "ph"],
      targetAps: 25,
      dailyStudyMinutes: 30,
      completedAt: Date.now(),
    }),
  );
});
await page.goto("http://localhost:3000/en/dashboard", { waitUntil: "networkidle" });

await page.screenshot({ path: "output/verify/dashboard-initial.png", fullPage: true });

const bodyText = await page.locator("body").innerText();
console.log("=== DASHBOARD TEXT ===");
console.log(bodyText.substring(0, 3000));

// List all visible links
const links = await page.locator("a:visible").all();
console.log("\n=== VISIBLE LINKS ===");
for (const link of links) {
  const text = (await link.innerText()).substring(0, 30).trim() || "(icon)";
  const href = await link.getAttribute("href");
  const ariaLabel = await link.getAttribute("aria-label");
  console.log(`  ${text} -> ${href} label="${ariaLabel || ""}"`);
}

// List all visible buttons
const buttons = await page.locator("button:visible").all();
console.log("\n=== VISIBLE BUTTONS ===");
for (const btn of buttons) {
  const text = (await btn.innerText()).substring(0, 40).trim() || "(icon)";
  console.log(`  "${text}"`);
}

await browser.close();
