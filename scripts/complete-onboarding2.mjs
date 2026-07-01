import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/onboarding", { waitUntil: "networkidle" });

// Expand Sciences section
const sciencesBtn = page.locator("button").filter({ hasText: "Sciences" }).first();
await sciencesBtn.click();
await page.waitForTimeout(300);

// Click on Mathematical Literacy card (since it's near Mathematics)
// Find all subject cards inside Sciences
const subjectCards = page.locator('[data-slot="card"]');
const count = await subjectCards.count();
console.log("Subject cards found:", count);

// Find the Mathematics card specifically (not Mathematical Literacy)
// Let's find it by checking each card's innerText
for (let i = 0; i < count; i++) {
  const card = subjectCards.nth(i);
  const text = await card.innerText();
  if (text.includes("Mathematics") && !text.includes("Literacy")) {
    console.log(`Found Mathematics card at index ${i}: "${text}"`);
    await card.click({ force: true });
    await page.waitForTimeout(500);
    break;
  }
}

const continueBtn = page.locator("button").filter({ hasText: "Continue" }).first();
const isDisabled = await continueBtn.isDisabled();
console.log("Continue button disabled:", isDisabled);

if (!isDisabled) {
  await continueBtn.click();
  await page.waitForTimeout(3000);
  console.log("After Continue URL:", page.url());
  await page.screenshot({ path: "output/verify/onboarding-complete.png" });
} else {
  console.log("Continue still disabled");
  await page.screenshot({ path: "output/verify/onboarding-stuck.png" });
}

const finalText = await page.locator("body").innerText();
console.log("Body preview:", finalText.substring(0, 600));
await browser.close();
