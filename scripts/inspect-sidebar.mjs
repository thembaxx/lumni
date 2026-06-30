import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const dir = "output/verify";
fs.mkdirSync(dir, { recursive: true });

function ss(name) {
  return page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
}

// Complete onboarding + accept cookies
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
  // Accept cookies
  localStorage.setItem("cookie-consent", JSON.stringify({ analytics: true, essential: true }));
});
await page.goto("http://localhost:3000/en/dashboard", { waitUntil: "networkidle" });
await ss("dashboard");

// Dismiss any overlays - accept analytics
const acceptAll = page.locator("button").filter({ hasText: "Accept all" }).first();
if (await acceptAll.isVisible()) {
  await acceptAll.click();
  await page.waitForTimeout(500);
}
await ss("dashboard-cookies-accepted");

// The app shows "Log in" because no real auth
// That's fine - the sidebar is still visible with all links
// Let's find the logo/Home link in the sidebar
console.log("Looking for desktop sidebar logo...");

const sidebarLogo = page.locator('a[aria-label="Home"], a[href="/dashboard" i]').first();
const logoVisible = await sidebarLogo.isVisible();
console.log("Logo link visible:", logoVisible);

// It might not be visible because it's in a collapsed section
// Let's check what's at the top of the sidebar
const allLinks = await page.locator("a").all();
for (const link of allLinks) {
  const href = await link.getAttribute("href");
  const text = (await link.innerText()).substring(0, 20).trim() || "(icon)";
  const visible = await link.isVisible();
  const ariaLabel = (await link.getAttribute("aria-label")) || "";
  if (
    visible &&
    (href === "/dashboard" ||
      ariaLabel === "Home" ||
      text.toLowerCase().includes("lumni") ||
      text.toLowerCase().includes("home"))
  ) {
    console.log(`Found matching link: text="${text}" href="${href}" aria="${ariaLabel}"`);
  }
}

// Look at sidebar structure
const sidebarHtml = await page.evaluate(() => {
  const sidebars = document.querySelectorAll('[class*="sidebar"], [class*="Sidebar"], nav');
  for (const s of sidebars) {
    if (s.textContent?.includes("Quiz") && s.textContent?.includes("Flashcards")) {
      return s.innerHTML.substring(0, 2000);
    }
  }
  return "No sidebar found";
});
console.log("\nSidebar HTML snippet:");
console.log(sidebarHtml.substring(0, 1500));

await browser.close();
