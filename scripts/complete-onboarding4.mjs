import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/onboarding", { waitUntil: "networkidle" });

// Find the Mathematics subject ID by inspecting the DOM
const subjectId = await page.evaluate(() => {
  const cards = document.querySelectorAll('[data-slot="card"]');
  // Find Mathematics card (not Mathematical Literacy)
  for (const card of cards) {
    const text = card.textContent || "";
    if (text.includes("Mathematics") && !text.includes("Literacy")) {
      // Get the subject ID from the badge div text (first 2 chars)
      const badge = card.querySelector('[class*="rounded-full"]');
      return badge?.textContent?.trim() || "ma";
    }
  }
  return "ma";
});
console.log("Mathematics subject ID:", subjectId);

// Directly click on the card element via evaluate (avoids pointer interception)
await page.evaluate(() => {
  const cards = document.querySelectorAll('[data-slot="card"]');
  for (const card of cards) {
    const text = card.textContent || "";
    if (text.includes("Mathematics") && !text.includes("Literacy")) {
      card.click();
      return;
    }
  }
});

await page.waitForTimeout(500);

// Check Continue button state
const continueBtn = page.locator("button").filter({ hasText: "Continue" }).first();
const isDisabled = await continueBtn.isDisabled();
console.log("Continue disabled:", isDisabled);

if (!isDisabled) {
  await continueBtn.click();
  await page.waitForTimeout(3000);
  console.log("URL after Continue:", page.url());
  await page.screenshot({ path: "output/verify/onboarding-complete4.png" });
} else {
  console.log("Continue still disabled");

  // Try clicking the Sciences section to collapse it first, then recollapse
  const isExpanded = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const sci = btns.find((b) => b.textContent?.includes("Sciences"));
    const svg = sci?.querySelector("svg");
    return !svg?.classList.contains("-rotate-90"); // collapsed = has -rotate-90
  });
  console.log("Sciences expanded:", isExpanded);

  // Try clicking the card directly (not forced)
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-slot="card"]'));
    const mathCard = cards.find((c) => {
      const t = c.textContent || "";
      return t.includes("Mathematics") && !t.includes("Literacy");
    });
    if (mathCard) {
      mathCard.click();
    }
  });
  await page.waitForTimeout(500);

  const isDisabled2 = await continueBtn.isDisabled();
  console.log("Continue disabled after 2nd try:", isDisabled2);

  if (!isDisabled2) {
    await continueBtn.click();
    await page.waitForTimeout(3000);
    console.log("URL after Continue:", page.url());
  }
}

const text = await page.locator("body").innerText();
console.log("Body:", text.substring(0, 500));
await page.screenshot({ path: "output/verify/onboarding-final.png" });
await browser.close();
