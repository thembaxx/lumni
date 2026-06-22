import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGenerate = vi.fn();
const mockGetCached = vi.fn();
const mockStore = vi.fn();

vi.mock("@/lib/ai/client", () => ({
  getAI: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  dexieDataAccess: { knowledgeGraph: {} },
}));

vi.mock("@/lib/ai/cached-ai-generator", () => ({
  CachedAIGenerator: class {
    generate = (...args: unknown[]) => mockGenerate(...args);
    getCached = (...args: unknown[]) => mockGetCached(...args);
    store = (...args: unknown[]) => mockStore(...args);
  },
}));

import { fetchGraph, getCachedGraph, storeGraph } from "../service";

const GRAPH = {
  nodes: [
    { id: "1", label: "Algebra", type: "prerequisite" },
    { id: "2", label: "Functions", type: "core" },
    { id: "3", label: "Calculus", type: "advanced" },
  ],
  edges: [
    { from: "1", to: "2", relation: "builds_on" },
    { from: "2", to: "3", relation: "leads_to" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchGraph", () => {
  test("delegates to CachedAIGenerator.generate", async () => {
    mockGenerate.mockResolvedValue(GRAPH);

    const result = await fetchGraph("Mathematics", "Functions");

    expect(result).toEqual(GRAPH);
    expect(mockGenerate).toHaveBeenCalledWith("Mathematics", "Functions");
  });

  test("returns empty graph when AI returns empty", async () => {
    const empty = { nodes: [], edges: [] };
    mockGenerate.mockResolvedValue(empty);

    const result = await fetchGraph("Mathematics", "Nonexistent");

    expect(result.nodes).toHaveLength(0);
  });
});

describe("getCachedGraph", () => {
  test("returns cached graph when available", async () => {
    mockGetCached.mockResolvedValue(GRAPH);

    const result = await getCachedGraph("Mathematics", "Functions");

    expect(result).toEqual(GRAPH);
  });

  test("returns null when nothing cached", async () => {
    mockGetCached.mockResolvedValue(null);

    const result = await getCachedGraph("Mathematics", "Functions");

    expect(result).toBeNull();
  });
});

describe("storeGraph", () => {
  test("delegates to CachedAIGenerator.store", async () => {
    mockStore.mockResolvedValue(undefined);

    await storeGraph("Mathematics", "Functions", GRAPH);

    expect(mockStore).toHaveBeenCalledWith("Mathematics", "Functions", GRAPH);
  });
});
