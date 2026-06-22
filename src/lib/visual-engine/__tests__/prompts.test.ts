import { describe, expect, test } from "vitest";
import { getDiagramPrompt, getImageSearchQuery, getMermaidPrompt } from "../prompts";

describe("getDiagramPrompt", () => {
  test("returns system and user prompts", () => {
    const result = getDiagramPrompt("Solve for x: 2x + 3 = 7", "mathematics", "algebra");
    expect(result).toHaveProperty("system");
    expect(result).toHaveProperty("user");
    expect(result.system).toEqual(expect.any(String));
    expect(result.user).toEqual(expect.any(String));
  });

  test("injects subject into system prompt", () => {
    const result = getDiagramPrompt("question", "physical-sciences", "forces");
    expect(result.system).toContain("physical-sciences");
  });

  test("includes question text in user prompt", () => {
    const result = getDiagramPrompt(
      "What is the force on a 5kg mass?",
      "physical-sciences",
      "newtons-laws",
    );
    expect(result.user).toContain("What is the force on a 5kg mass?");
  });

  test("different subjects produce different prompts", () => {
    const mathPrompt = getDiagramPrompt("question", "mathematics", "algebra");
    const sciPrompt = getDiagramPrompt("question", "physical-sciences", "forces");
    expect(mathPrompt.system).not.toBe(sciPrompt.system);
  });
});

describe("getMermaidPrompt", () => {
  test("returns system and user prompts", () => {
    const result = getMermaidPrompt("Draw a flowchart", "information-technology", "algorithms");
    expect(result).toHaveProperty("system");
    expect(result).toHaveProperty("user");
  });

  test("injects subject into system prompt", () => {
    const result = getMermaidPrompt("flowchart", "cat", "algorithms");
    expect(result.system).toContain("cat");
  });

  test("includes question and topic in user prompt", () => {
    const result = getMermaidPrompt(
      "Show sorting algorithm",
      "information-technology",
      "bubble-sort",
    );
    expect(result.user).toContain("sorting algorithm");
    expect(result.user).toContain("bubble-sort");
  });
});

describe("getImageSearchQuery", () => {
  test("returns search query string", () => {
    const query = getImageSearchQuery("What is a mitochondrion?", "life-sciences", "cell-biology");
    expect(query).toEqual(expect.any(String));
    expect(query.length).toBeGreaterThan(0);
  });

  test("includes subject and topic in query", () => {
    const query = getImageSearchQuery("Explain photosynthesis", "life-sciences", "plant-biology");
    expect(query).toContain("plant-biology");
    expect(query).toContain("life-sciences");
  });

  test("includes 'commons' in query", () => {
    const query = getImageSearchQuery("test", "math", "algebra");
    expect(query).toContain("commons");
  });

  test("strips HTML tags from question text", () => {
    const query = getImageSearchQuery("<p>What is a force?</p>", "physical-sciences", "forces");
    expect(query).not.toContain("<p>");
    expect(query).not.toContain("</p>");
  });

  test("strips LaTeX math delimiters from question text", () => {
    const query = getImageSearchQuery("Solve $x^2 + 2x + 1 = 0$", "mathematics", "algebra");
    expect(query).not.toContain("$");
  });

  test("truncates to first 8 words", () => {
    const query = getImageSearchQuery(
      "one two three four five six seven eight nine ten",
      "math",
      "algebra",
    );
    const words = query.split(" ");
    const withoutCommonsAndTopic = words.filter(
      (w) => w !== "commons" && w !== "math" && w !== "algebra",
    );
    expect(withoutCommonsAndTopic.length).toBeLessThanOrEqual(8);
  });

  test("removes common diagram-related terms", () => {
    const query = getImageSearchQuery(
      "Draw and label a diagram of a plant cell",
      "life-sciences",
      "cell-biology",
    );
    expect(query).not.toContain("draw");
    expect(query).not.toContain("label");
    expect(query).not.toContain("diagram");
  });
});
