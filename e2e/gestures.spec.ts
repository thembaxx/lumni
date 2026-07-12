import { test, expect } from "@playwright/test";

const mockQuestions = [
  {
    id: "mock-q-1",
    type: "multiple-choice",
    subject: "mathematics",
    topic: "algebra",
    difficulty: "Medium",
    bloomTaxonomy: "apply",
    points: 10,
    questionText: "What is 2 + 2?",
    hint: "Think about basic addition",
    explanation: "2 + 2 = 4",
    body: {
      options: [
        { id: "A", text: "3", isCorrect: false },
        { id: "B", text: "4", isCorrect: true },
        { id: "C", text: "5", isCorrect: false },
        { id: "D", text: "6", isCorrect: false },
      ],
      correctOptionId: "B",
      allowMultiple: false,
    },
  },
  {
    id: "mock-q-2",
    type: "multiple-choice",
    subject: "mathematics",
    topic: "algebra",
    difficulty: "Medium",
    bloomTaxonomy: "apply",
    points: 10,
    questionText: "What is 3 + 3?",
    hint: "Think about basic addition",
    explanation: "3 + 3 = 6",
    body: {
      options: [
        { id: "A", text: "5", isCorrect: false },
        { id: "B", text: "6", isCorrect: true },
        { id: "C", text: "7", isCorrect: false },
        { id: "D", text: "8", isCorrect: false },
      ],
      correctOptionId: "B",
      allowMultiple: false,
    },
  },
  {
    id: "mock-q-3",
    type: "multiple-choice",
    subject: "mathematics",
    topic: "algebra",
    difficulty: "Medium",
    bloomTaxonomy: "apply",
    points: 10,
    questionText: "What is 4 + 4?",
    hint: "Think about basic addition",
    explanation: "4 + 4 = 8",
    body: {
      options: [
        { id: "A", text: "7", isCorrect: false },
        { id: "B", text: "8", isCorrect: true },
        { id: "C", text: "9", isCorrect: false },
        { id: "D", text: "10", isCorrect: false },
      ],
      correctOptionId: "B",
      allowMultiple: false,
    },
  },
];

const mockResponse = {
  questions: mockQuestions,
  count: 3,
  type: "multiple-choice",
};

test.describe("Quiz navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
    await page.route("**/api/engine/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockResponse),
      });
    });
    page.on("pageerror", (err) => console.error("Page error:", err.message, err.stack));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.error("Console error:", msg.text());
    });
  });

  async function startQuiz(page: import("@playwright/test").Page) {
    // Navigate to quiz with subject preset
    await page.goto("/en/quiz?subject=mathematics", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Click the Mathematics subject card to start the session
    const mathButton = page.getByRole("button", { name: /mathematics/i }).first();
    const buttonVisible = await mathButton.isVisible({ timeout: 8000 }).catch(() => false);
    if (!buttonVisible) {
      // Subject may have been auto-selected — wait for questions
      await page.waitForFunction(() => document.body.textContent?.includes("What is 2 + 2?"), {
        timeout: 15000,
      });
      return;
    }
    await mathButton.click();

    // Wait for mock API response + question rendering
    await page.waitForFunction(() => document.body.textContent?.includes("What is 2 + 2?"), {
      timeout: 20000,
    });
  }

  test("arrow right navigates to next question", async ({ page }) => {
    await startQuiz(page);

    await page.keyboard.press("ArrowRight");

    await page.waitForFunction(() => document.body.textContent?.includes("What is 3 + 3?"), {
      timeout: 5000,
    });

    await expect(page.locator("text=What is 3 + 3?").first()).toBeVisible({ timeout: 3000 });
  });

  test("arrow left returns to previous question", async ({ page }) => {
    await startQuiz(page);

    await page.keyboard.press("ArrowRight");

    await page.waitForFunction(() => document.body.textContent?.includes("What is 3 + 3?"), {
      timeout: 5000,
    });

    await page.keyboard.press("ArrowLeft");

    await page.waitForFunction(() => document.body.textContent?.includes("What is 2 + 2?"), {
      timeout: 5000,
    });

    await expect(page.locator("text=What is 2 + 2?").first()).toBeVisible({ timeout: 3000 });
  });

  test("arrow right then arrow up does not navigate", async ({ page }) => {
    await startQuiz(page);

    await page.keyboard.press("ArrowUp");

    await page.waitForTimeout(600);

    await expect(page.locator("text=What is 2 + 2?").first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Pull-to-refresh", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lumni_onboarding", JSON.stringify({ isComplete: true }));
    });
  });

  test("pull gesture applies translateY transform", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "load" });
    await page.waitForTimeout(3000);

    const scrollContainerExists = await page.locator("[data-scroll-container]").count();
    if (scrollContainerExists === 0) {
      test.skip(true, "Scroll container requires authenticated dashboard");
      return;
    }
    await page.waitForSelector("[data-scroll-container]", { timeout: 15000 });

    const scrollContainer = page.locator("[data-scroll-container]").first();
    const box = await scrollContainer.boundingBox();
    if (!box) throw new Error("Scroll container not found");

    const centerX = box.x + box.width * 0.5;
    const startY = box.y + 10;
    const endY = box.y + 200;

    // Component uses pointer events (not touch events) since commit be3a4dfb
    await page.dispatchEvent("[data-scroll-container]", "pointerdown", {
      pointerId: 1,
      clientX: centerX,
      clientY: startY,
    });

    for (let i = 1; i <= 10; i++) {
      const y = startY + (endY - startY) * (i / 10);
      await page.dispatchEvent("[data-scroll-container]", "pointermove", {
        pointerId: 1,
        clientX: centerX,
        clientY: y,
      });
      await page.waitForTimeout(20);
    }

    const transformAfterMove = await scrollContainer.evaluate((el) => el.style.transform);
    expect(transformAfterMove).toContain("translateY");

    await page.dispatchEvent("[data-scroll-container]", "pointerup", {
      pointerId: 1,
      clientX: centerX,
      clientY: endY,
    });

    await page.waitForTimeout(500);

    const transformAfterEnd = await scrollContainer.evaluate((el) => el.style.transform);
    expect(transformAfterEnd).toBe("");
  });
});
