import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Test Konami with error overlay dismiss
await p.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await p.evaluate(() => {
  localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
  localStorage.setItem("cookie-consent", JSON.stringify({ analytics: true, essential: true }));
});
await p.goto("http://localhost:3000/en/dashboard", { waitUntil: "networkidle" });
await p.waitForTimeout(1000);

// Dismiss any error overlay
const dismissBtn = p.locator("button").filter({ hasText: "Dismiss" }).first();
if (await dismissBtn.isVisible()) {
  console.log("Dismissing error overlay");
  await dismissBtn.click();
  await p.waitForTimeout(300);
}

// Accept cookies
const accept = p.locator("button").filter({ hasText: "Accept all" }).first();
if (await accept.isVisible()) {
  await accept.click();
  await p.waitForTimeout(300);
}

// Wait a moment for page to stabilize
await p.waitForTimeout(500);

// Send Konami code
console.log("Sending Konami code...");
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
  await p.keyboard.press(key);
  await p.waitForTimeout(100);
}
await p.waitForTimeout(1500);

const html = await p.locator("body").innerHTML();
if (html.includes("+30 XP") || html.includes("Secret Mode")) {
  console.log("  ✓ Konami code triggered");
} else {
  // Check for any overlay
  const hasOverlay = await p.evaluate(() => {
    return document.querySelector('[class*="z-\\[9999\\]"]') !== null;
  });
  if (hasOverlay) {
    console.log("  ✓ Konami code triggered (overlay found)");
  } else {
    console.log("  ✗ Konami code not triggered");
    // Debug: check if keydown events are being received
    const keyEvents = await p.evaluate(() => {
      const logs = [];
      const handler = (e) => logs.push(e.key);
      document.addEventListener("keydown", handler, { once: true });
      setTimeout(() => document.removeEventListener("keydown", handler), 100);
      return logs;
    });
    console.log("  Key events captured:", keyEvents);
  }
}

await p.screenshot({ path: "output/verify/konami-final.png" });
await browser.close();
