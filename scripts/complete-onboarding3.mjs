import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/onboarding", { waitUntil: "networkidle" });

// Expand Sciences
const sciencesBtn = page.locator("button").filter({ hasText: "Sciences" }).first();
await sciencesBtn.click();
await page.waitForTimeout(300);

// Try selecting Mathematics by dispatching a click via JS
const selected = await page.evaluate(() => {
  const cards = document.querySelectorAll('[data-slot="card"]');
  let mathCard = null;
  for (const card of cards) {
    const text = card.textContent || "";
    if (text.includes("Mathematics") && !text.includes("Literacy")) {
      mathCard = card;
      break;
    }
  }
  if (mathCard) {
    mathCard.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return "clicked";
  }
  return "not found";
});
console.log("Select via JS:", selected);

await page.waitForTimeout(500);

const continueBtn = page.locator("button").filter({ hasText: "Continue" }).first();
const isDisabled = await continueBtn.isDisabled();
console.log("Continue disabled:", isDisabled);

if (!isDisabled) {
  await continueBtn.click();
  await page.waitForTimeout(3000);
  console.log("URL after Continue:", page.url());
  await page.screenshot({ path: "output/verify/onboarding-complete3.png" });
} else {
  console.log("Continue still disabled — trying again via JS click");
  // Try clicking via JS
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const cont = btns.find((b) => b.textContent?.includes("Continue"));
    if (cont) cont.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(3000);
  console.log("URL after JS Continue:", page.url());
  await page.screenshot({ path: "output/verify/onboarding-js-continue.png" });
}

const text = await page.locator("body").innerText();
console.log("Body:", text.substring(0, 800));
await browser.close();
