import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGenerate = vi.fn();
const mockGetCached = vi.fn();
const mockStore = vi.fn();

vi.mock("@/lib/ai/client", () => ({
  getAI: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  dexieDataAccess: { studyGuides: {} },
}));

vi.mock("@/lib/ai/cached-ai-generator", () => ({
  CachedAIGenerator: class {
    generate = (...args: unknown[]) => mockGenerate(...args);
    getCached = (...args: unknown[]) => mockGetCached(...args);
    store = (...args: unknown[]) => mockStore(...args);
  },
}));

import { generateGuide, getCachedGuide, storeGuide } from "../service";

const GUIDE = {
  sections: [
    {
      title: "Introduction",
      content: "Functions map inputs to outputs.",
      keyPoints: ["Domain", "Range", "Mapping"],
    },
    {
      title: "Types of Functions",
      content: "Linear, quadratic, exponential.",
      keyPoints: ["Linear", "Quadratic", "Exponential"],
    },
  ],
  summary: "Functions are fundamental building blocks in mathematics.",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateGuide", () => {
  test("delegates to CachedAIGenerator.generate", async () => {
    mockGenerate.mockResolvedValue(GUIDE);

    const result = await generateGuide("Mathematics", "Functions");

    expect(result).toEqual(GUIDE);
    expect(mockGenerate).toHaveBeenCalledWith("Mathematics", "Functions");
  });

  test("returns empty guide when AI returns empty", async () => {
    const empty = { sections: [], summary: "" };
    mockGenerate.mockResolvedValue(empty);

    const result = await generateGuide("Mathematics", "Nonexistent");

    expect(result.sections).toHaveLength(0);
    expect(result.summary).toBe("");
  });
});

describe("getCachedGuide", () => {
  test("returns cached guide when available", async () => {
    mockGetCached.mockResolvedValue(GUIDE);

    const result = await getCachedGuide("Mathematics", "Functions");

    expect(result).toEqual(GUIDE);
  });

  test("returns null when nothing cached", async () => {
    mockGetCached.mockResolvedValue(null);

    const result = await getCachedGuide("Mathematics", "Functions");

    expect(result).toBeNull();
  });
});

describe("storeGuide", () => {
  test("delegates to CachedAIGenerator.store", async () => {
    mockStore.mockResolvedValue(undefined);

    await storeGuide("Mathematics", "Functions", GUIDE);

    expect(mockStore).toHaveBeenCalledWith("Mathematics", "Functions", GUIDE);
  });

  test("stores guide with all sections intact", async () => {
    const guideWith3Sections = {
      ...GUIDE,
      sections: [
        ...GUIDE.sections,
        {
          title: "Exam Tips",
          content: "Practice past papers.",
          keyPoints: ["Time management", "Show working"],
        },
      ],
    };
    mockStore.mockResolvedValue(undefined);

    await storeGuide("Mathematics", "Functions", guideWith3Sections);

    const storedGuide = mockStore.mock.calls[0]?.[2];
    expect(storedGuide?.sections).toHaveLength(3);
  });
});
