import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/onboarding", { waitUntil: "networkidle" });

// Click Sciences category to expand
const sciencesBtn = page.locator("button").filter({ hasText: "Sciences" }).first();
if (await sciencesBtn.isVisible()) {
  await sciencesBtn.click();
  await page.waitForTimeout(500);
}

// Inspect the first subject inside Sciences that has Mathematics
const mathElements = page.locator("div, span, button, label").filter({ hasText: "Mathematics" });
const count = await mathElements.count();
console.log("Elements matching 'Mathematics':", count);

for (let i = 0; i < count && i < 3; i++) {
  const el = mathElements.nth(i);
  const tag = await el.evaluate((e) => e.tagName);
  const role = await el.evaluate((e) => e.getAttribute("role") || "none");
  const type = await el.evaluate((e) => e.getAttribute("type") || "none");
  const classes = await el.evaluate((e) => e.className?.substring(0, 80) || "");
  const parentTag = await el.evaluate((e) => e.parentElement?.tagName || "");
  const parentClasses = await el.evaluate(
    (e) => e.parentElement?.className?.substring(0, 80) || "",
  );
  const clickable = await el.evaluate((e) => {
    const tag = e.tagName;
    const role = e.getAttribute("role");
    const type = e.getAttribute("type");
    return !!(
      tag === "A" ||
      tag === "BUTTON" ||
      role === "button" ||
      role === "checkbox" ||
      type === "checkbox" ||
      type === "radio"
    );
  });
  console.log(`  [${i}] tag=${tag} role=${role} type=${type} clickable=${clickable}`);
  console.log(`       class=${classes}`);
  console.log(`       parent: ${parentTag} class=${parentClasses}`);
}

// Try finding a checkbox or toggle in the Sciences section
const checkboxes = page.locator('[role="checkbox"], input[type="checkbox"]');
const cbCount = await checkboxes.count();
console.log("\nCheckboxes on page:", cbCount);
for (let i = 0; i < Math.min(cbCount, 10); i++) {
  const cb = checkboxes.nth(i);
  const visible = await cb.isVisible();
  const label = await cb.evaluate((e) => {
    // Find associated label or aria-label
    return (
      e.getAttribute("aria-label") ||
      e.getAttribute("name") ||
      (e.nextSibling?.textContent || "").trim() ||
      e.id
    );
  });
  console.log(`  [${i}] visible=${visible} label="${label}"`);
}

await browser.close();
