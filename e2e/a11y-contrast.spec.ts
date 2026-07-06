import { expect, test } from "@playwright/test";

interface RouteTest {
  path: string;
  label: string;
}

const routes: RouteTest[] = [
  { path: "/", label: "Home" },
  { path: "/sign-in", label: "Sign in" },
  { path: "/sign-up", label: "Sign up" },
  { path: "/auth/forgot-password", label: "Forgot password" },
  { path: "/auth/reset-password", label: "Reset password" },
  { path: "/auth/verify-email", label: "Verify email" },
  { path: "/exam", label: "Exam" },
  { path: "/exams", label: "Exams" },
  { path: "/flashcards", label: "Flashcards" },
  { path: "/study", label: "Study" },
  { path: "/study-plan", label: "Study plan" },
  { path: "/study-guide", label: "Study guide" },
  { path: "/solve", label: "Solve" },
  { path: "/chat", label: "Chat" },
  { path: "/search", label: "Search" },
  { path: "/tools", label: "Tools" },
  { path: "/problems", label: "Problems" },
  { path: "/pronunciation", label: "Pronunciation" },
  { path: "/bookmarks", label: "Bookmarks" },
  { path: "/leaderboard", label: "Leaderboard" },
  { path: "/questions", label: "Questions" },
  { path: "/study-groups", label: "Study groups" },
  { path: "/support", label: "Support" },
  { path: "/parent", label: "Parent" },
  { path: "/teacher", label: "Teacher" },
  { path: "/premium", label: "Premium" },
  { path: "/privacy", label: "Privacy" },
  { path: "/terms", label: "Terms" },
  { path: "/cookie-policy", label: "Cookie policy" },
  { path: "/dictionary", label: "Dictionary" },
  { path: "/past-papers", label: "Past papers" },
  { path: "/stories", label: "Stories" },
  { path: "/upload", label: "Upload" },
  { path: "/admin", label: "Admin" },
  { path: "/dev", label: "Dev" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/quiz", label: "Quiz" },
  { path: "/review", label: "Review" },
  { path: "/settings", label: "Settings" },
  { path: "/onboarding", label: "Onboarding" },
  { path: "/exam-dates", label: "Exam dates" },
  { path: "/progress", label: "Progress" },
  { path: "/practice", label: "Practice" },
  { path: "/learn", label: "Learn" },
  { path: "/lessons", label: "Lessons" },
];

async function getContrastViolations(page: import("@playwright/test").Page) {
  const { AxeBuilder } = await import("@axe-core/playwright");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2aa", "wcag21aa"])
    .options({ runOnly: { type: "rule", values: ["color-contrast"] } })
    .analyze();

  return results.violations
    .filter((v) => v.id === "color-contrast")
    .filter((v) => !v.nodes.some((n) => n.html.includes("next-error")));
}

test.describe("WCAG AA contrast audit", () => {
  // First test often hits cold start; use longer timeout
  test.use({ navigationTimeout: 60000 });
  for (const [, route] of routes.entries()) {
    test(`${route.label} (light mode)`, async ({ page }) => {
      await page.goto(`/en${route.path}`, { waitUntil: "commit" });
      await page.waitForLoadState("networkidle");
      await page.emulateMedia({ colorScheme: "light" });
      await page
        .waitForFunction(() => !document.documentElement.classList.contains("dark"), {
          timeout: 5000,
        })
        .catch(() => {});
      const violations = await getContrastViolations(page);
      if (violations.length > 0) {
        console.log(`Contrast violations on ${route.path} (light):`);
        for (const v of violations) {
          for (const node of v.nodes.slice(0, 3)) {
            console.log(`  ${v.id}: ${node.html} (${node.failureSummary})`);
          }
        }
      }
      expect(violations.length).toBe(0);
    });

    test(`${route.label} (dark mode)`, async ({ page }) => {
      await page.goto(`/en${route.path}`, { waitUntil: "commit" });
      await page.waitForLoadState("networkidle");
      await page.emulateMedia({ colorScheme: "dark" });
      await page.waitForFunction(() => document.documentElement.classList.contains("dark"), {
        timeout: 5000,
      });
      const violations = await getContrastViolations(page);
      if (violations.length > 0) {
        console.log(`Contrast violations on ${route.path} (dark):`);

        for (const v of violations) {
          for (const node of v.nodes.slice(0, 3)) {
            console.log(`  ${v.id}: ${node.html} (${node.failureSummary})`);
          }
        }
      }
      expect(violations.length).toBe(0);
    });
  }
});
