import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.emulateMedia({ colorScheme: "dark" });

await page.goto("http://localhost:3000/en", { waitUntil: "networkidle", timeout: 15000 });

// Light mode
await page.evaluate(() => document.documentElement.classList.remove("dark"));
await page.waitForTimeout(500);
await page.screenshot({ path: "theme-light.png", fullPage: true });

// Dark mode
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(500);
await page.screenshot({ path: "theme-dark.png", fullPage: true });

// Extract computed CSS vars
const lightCSS = await page.evaluate(() => {
  const root = document.documentElement;
  root.classList.remove("dark");
  root.classList.add("light");
  const s = getComputedStyle(root);
  const vars = [
    "--system-background",
    "--system-background-secondary",
    "--system-background-elevated",
    "--system-surface",
    "--system-surface-secondary",
    "--system-accent",
    "--system-accent-foreground",
    "--system-text-primary",
    "--system-text-secondary",
    "--system-text-tertiary",
    "--system-separator",
    "--system-success",
    "--system-destructive",
    "--system-warning",
    "--system-info",
    "--radius",
    "--radius-card-lg",
    "--sidebar",
    "--sidebar-foreground",
  ];
  return Object.fromEntries(vars.map((v) => [v, s.getPropertyValue(v).trim()]));
});

const darkCSS = await page.evaluate(() => {
  const root = document.documentElement;
  root.classList.remove("light");
  root.classList.add("dark");
  const s = getComputedStyle(root);
  const vars = [
    "--system-background",
    "--system-background-secondary",
    "--system-background-elevated",
    "--system-surface",
    "--system-surface-secondary",
    "--system-accent",
    "--system-accent-foreground",
    "--system-text-primary",
    "--system-text-secondary",
    "--system-text-tertiary",
    "--system-separator",
    "--system-success",
    "--system-destructive",
    "--system-warning",
    "--system-info",
    "--radius",
    "--radius-card-lg",
    "--sidebar",
    "--sidebar-foreground",
  ];
  return Object.fromEntries(vars.map((v) => [v, s.getPropertyValue(v).trim()]));
});

console.log("LIGHT:", JSON.stringify(lightCSS));
console.log("DARK:", JSON.stringify(darkCSS));

const allLight = Object.values(lightCSS).join(" ");
const allDark = Object.values(darkCSS).join(" ");

const hue70 = (allLight + allDark).match(/oklch\([^)]*70[,)]/g);
const hue60 = (allLight + allDark).match(/oklch\([^)]*60[,)]/g);

console.log("\nHue-70 (amber) remnants:", hue70?.length || 0, hue70 || []);
console.log("Hue-60 (warm) remnants:", hue60?.length || 0, hue60 || []);

if (!hue70 && !hue60) console.log("\n✓ All tokens are cool-aligned.");
else console.log("\n✗ Warm/amber tokens still present!");

await browser.close();
