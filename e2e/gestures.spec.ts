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

test.describe("Swipeable quiz navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/engine/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockResponse),
      });
    });
  });

  test("swipe left navigates to next question", async ({ page }) => {
    await page.goto("/en/quiz?subject=mathematics", { waitUntil: "networkidle" });

    await page.waitForFunction(() => document.body.textContent?.includes("What is 2 + 2?"), {
      timeout: 15000,
    });

    const main = page.locator("main").first();
    const box = await main.boundingBox();
    if (!box) throw new Error("Main element not found");

    const startX = box.x + box.width * 0.8;
    const endX = box.x + box.width * 0.2;
    const centerY = box.y + box.height * 0.5;

    await page.mouse.move(startX, centerY);
    await page.mouse.down();
    await page.mouse.move(endX, centerY, { steps: 10 });
    await page.mouse.up();

    await page.waitForFunction(() => document.body.textContent?.includes("What is 3 + 3?"), {
      timeout: 5000,
    });

    await expect(page.locator("text=What is 3 + 3?").first()).toBeVisible({ timeout: 3000 });
  });

  test("swipe right returns to previous question", async ({ page }) => {
    await page.goto("/en/quiz?subject=mathematics", { waitUntil: "networkidle" });

    await page.waitForFunction(() => document.body.textContent?.includes("What is 2 + 2?"), {
      timeout: 15000,
    });

    const main = page.locator("main").first();
    const box = await main.boundingBox();
    if (!box) throw new Error("Main element not found");

    const centerY = box.y + box.height * 0.5;

    // Swipe left to go to question 2
    await page.mouse.move(box.x + box.width * 0.8, centerY);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, centerY, { steps: 10 });
    await page.mouse.up();

    await page.waitForFunction(() => document.body.textContent?.includes("What is 3 + 3?"), {
      timeout: 5000,
    });

    // Swipe right to go back to question 1
    await page.mouse.move(box.x + box.width * 0.2, centerY);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, centerY, { steps: 10 });
    await page.mouse.up();

    await page.waitForFunction(() => document.body.textContent?.includes("What is 2 + 2?"), {
      timeout: 5000,
    });

    await expect(page.locator("text=What is 2 + 2?").first()).toBeVisible({ timeout: 3000 });
  });

  test("small drag below threshold does not navigate", async ({ page }) => {
    await page.goto("/en/quiz?subject=mathematics", { waitUntil: "networkidle" });

    await page.waitForFunction(() => document.body.textContent?.includes("What is 2 + 2?"), {
      timeout: 15000,
    });

    const main = page.locator("main").first();
    const box = await main.boundingBox();
    if (!box) throw new Error("Main element not found");

    const centerY = box.y + box.height * 0.5;
    const centerX = box.x + box.width * 0.5;

    // Small drag (below 80px threshold)
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX - 40, centerY, { steps: 5 });
    await page.mouse.up();

    await page.waitForTimeout(600);

    // Should still be on question 1
    await expect(page.locator("text=What is 2 + 2?").first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Pull-to-refresh", () => {
  test("pull gesture applies translateY transform", async ({ page }) => {
    await page.goto("/en/dashboard", { waitUntil: "networkidle" });

    await page.waitForSelector("[data-scroll-container]", { timeout: 10000 });

    const scrollContainer = page.locator("[data-scroll-container]").first();
    const box = await scrollContainer.boundingBox();
    if (!box) throw new Error("Scroll container not found");

    const centerX = box.x + box.width * 0.5;
    const startY = box.y + 10;
    const endY = box.y + 200;

    await page.dispatchEvent("[data-scroll-container]", "touchstart", {
      touches: [{ clientX: centerX, clientY: startY }],
    });

    for (let i = 1; i <= 10; i++) {
      const y = startY + (endY - startY) * (i / 10);
      await page.dispatchEvent("[data-scroll-container]", "touchmove", {
        touches: [{ clientX: centerX, clientY: y }],
      });
      await page.waitForTimeout(20);
    }

    const transformAfterMove = await scrollContainer.evaluate((el) => el.style.transform);
    expect(transformAfterMove).toContain("translateY");

    await page.dispatchEvent("[data-scroll-container]", "touchend", {
      changedTouches: [{ clientX: centerX, clientY: endY }],
    });

    await page.waitForTimeout(500);

    const transformAfterEnd = await scrollContainer.evaluate((el) => el.style.transform);
    expect(transformAfterEnd).toBe("");
  });
});
