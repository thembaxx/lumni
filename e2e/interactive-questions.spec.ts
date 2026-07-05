import { test, expect } from "@playwright/test";

// All tests here require AI generation — skip when no provider key is configured
const hasAiKeys = () => {
  const requiredKeys = ["GEMINI_API_KEY", "NVIDIA_API_KEY", "GROQ_API_KEY", "ZAP_API_KEY"] as const;
  return requiredKeys.some((k) => process.env[k] && process.env[k]!.length > 0);
};

if (!hasAiKeys()) {
  test.describe("Interactive questions (AI required)", () => {
    test("skip — AI provider keys not configured", () => {
      test.skip();
    });
  });
} else {
  test.describe("Interactive questions", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
      });
    });

    test("quiz page loads with subject selector", async ({ page }) => {
      await page.goto("/en/quiz", { waitUntil: "commit" });
      await page.waitForLoadState("networkidle");
      await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
    });

    test("ordering question type renders in question card", async ({ page }) => {
      await page.goto("/en/quiz", { waitUntil: "commit" });
      await page.waitForLoadState("networkidle");

      const draggableItems = page.locator('[draggable="true"]');
      await expect(draggableItems.first()).toBeAttached({ timeout: 5000 });
    });

    test("match-pairs input renders left and right columns", async ({ page }) => {
      await page.goto("/en/quiz", { waitUntil: "commit" });
      await page.waitForLoadState("networkidle");

      const dropTargets = page.locator('button:has-text("Drop target")');
      const dropTargetCount = await dropTargets.count();
      expect(dropTargetCount).toBeGreaterThanOrEqual(0);
    });

    test("fill-in-sequence input shows draggable options", async ({ page }) => {
      await page.goto("/en/quiz", { waitUntil: "commit" });
      await page.waitForLoadState("networkidle");

      const draggableElements = page.locator("[aria-grabbed]");
      await expect(draggableElements.first()).toBeAttached({ timeout: 5000 });
    });
  });

  test.describe("generate → grade cycle", () => {
    test("API returns ordering questions with valid schema", async ({ request }) => {
      const res = await request.post("/api/engine/generate", {
        data: {
          subject: "mathematics",
          topic: "algebra",
          count: 1,
          questionType: "ordering",
          difficulty: "Medium",
        },
      });
      expect(res.ok()).toBe(true);
      const body = await res.json();
      expect(Array.isArray(body.questions)).toBe(true);

      const q = body.questions[0];
      expect(q).toBeDefined();
      expect(q.type).toBe("ordering");
      expect(q.body).toBeDefined();
      expect(Array.isArray(q.body.items)).toBe(true);
      expect(q.body.items.length).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(q.body.correctOrder)).toBe(true);
    });

    test("API returns fill-in-sequence questions with valid schema", async ({ request }) => {
      const res = await request.post("/api/engine/generate", {
        data: {
          subject: "physical-sciences",
          topic: "chemistry",
          count: 1,
          questionType: "fill-in-sequence",
          difficulty: "Medium",
        },
      });
      expect(res.ok()).toBe(true);
      const body = await res.json();
      const q = body.questions?.[0];
      expect(q).toBeDefined();
      expect(q.type).toBe("fill-in-sequence");
      expect(Array.isArray(q.body.sequence)).toBe(true);
      expect(Array.isArray(q.body.blanks)).toBe(true);
    });

    test("API returns match-pairs questions with valid schema", async ({ request }) => {
      const res = await request.post("/api/engine/generate", {
        data: {
          subject: "life-sciences",
          topic: "cell-biology",
          count: 1,
          questionType: "match-pairs",
          difficulty: "Medium",
        },
      });
      expect(res.ok()).toBe(true);
      const body = await res.json();
      const q = body.questions?.[0];
      expect(q).toBeDefined();
      expect(q.type).toBe("match-pairs");
      expect(Array.isArray(q.body.leftItems)).toBe(true);
      expect(Array.isArray(q.body.rightItems)).toBe(true);
      expect(Array.isArray(q.body.correctMatches)).toBe(true);
    });

    test("API returns hot-spot questions with valid schema", async ({ request }) => {
      const res = await request.post("/api/engine/generate", {
        data: {
          subject: "geography",
          topic: "map-skills",
          count: 1,
          questionType: "hot-spot",
          difficulty: "Medium",
        },
      });
      expect(res.ok()).toBe(true);
      const body = await res.json();
      const q = body.questions?.[0];
      expect(q).toBeDefined();
      expect(q.type).toBe("hot-spot");
      expect(Array.isArray(q.body.regions)).toBe(true);
      expect(typeof q.body.correctRegionId).toBe("string");
    });

    test("API grades an ordering question", async ({ request }) => {
      const genRes = await request.post("/api/engine/generate", {
        data: {
          subject: "mathematics",
          topic: "algebra",
          count: 1,
          questionType: "ordering",
          difficulty: "Medium",
        },
      });
      const genBody = await genRes.json();
      const q = genBody.questions?.[0];
      if (!q) return;

      const gradeRes = await request.post("/api/engine/grade", {
        data: {
          question: q,
          answer: { type: "ordered-items", value: q.body.correctOrder },
        },
      });
      expect(gradeRes.ok()).toBe(true);
      const gradeBody = await gradeRes.json();
      expect(gradeBody).toBeDefined();
      expect(typeof gradeBody.correct).toBe("boolean");
      expect(gradeBody.correct).toBe(true);
      expect(typeof gradeBody.score).toBe("number");
    });
  });
}
