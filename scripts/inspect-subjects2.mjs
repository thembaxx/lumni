import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/onboarding", { waitUntil: "networkidle" });

// Click Sciences to expand
const sciencesBtn = page.locator("button").filter({ hasText: "Sciences" }).first();
await sciencesBtn.click();
await page.waitForTimeout(500);

// Get the HTML structure of the expanded Sciences section
const html = await page.evaluate(() => {
  // Find all buttons
  const btns = Array.from(document.querySelectorAll("button"));
  const sciBtn = btns.find((b) => b.textContent?.includes("Sciences"));
  if (!sciBtn) return "no sciences button";
  // Get next sibling or parent's next element
  let parent = sciBtn.parentElement;
  return parent?.innerHTML?.substring(0, 3000) || "no parent";
});
console.log("Sciences section HTML:");
console.log(html);

// Also find the specific Mathematics entry
const mathElements = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll("div, span"));
  return items
    .filter((el) => el.textContent?.includes("Grade") && el.closest('[class*="subject"]'))
    .slice(0, 5)
    .map((el) => ({
      tag: el.tagName,
      text: el.textContent?.substring(0, 50),
      class: el.className?.substring(0, 60),
      parentClass: el.parentElement?.className?.substring(0, 60),
      id: el.id,
    }));
});
console.log("\nSubject items:");
console.log(JSON.stringify(mathElements, null, 2));

await page.screenshot({ path: "output/verify/sciences-expanded.png" });
await browser.close();
