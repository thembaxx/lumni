import { Effect } from "effect";
import { describe, expect, test, vi } from "vitest";
import type { AIClient } from "@/lib/ai/client";
import type { DataAccess } from "@/lib/db/data-access";
import { CachedAIGenerator, type CachedAIGeneratorConfig } from "../cached-ai-generator";

function mockDb(): DataAccess {
  const store = new Map<string, { expiresAt: number; data: string }>();
  return {
    knowledgeGraph: {
      get: vi.fn((key: string) => Promise.resolve(store.get(key))),
      put: vi.fn((entry: { key: string }) => {
        store.set(entry.key, entry as unknown as { expiresAt: number; data: string });
        return Promise.resolve("");
      }),
    },
  } as unknown as DataAccess;
}

function mockAi(content: string): AIClient {
  return {
    generateWithSystem: vi.fn(() => Promise.resolve({ content, provider: "mock", model: "test" })),
  } as unknown as AIClient;
}

function mockAiEmpty(): AIClient {
  return {
    generateWithSystem: vi.fn(() => Promise.resolve({ available: false, error: "no provider" })),
  } as unknown as AIClient;
}

function mockAiParseError(): AIClient {
  return {
    generateWithSystem: vi.fn(() =>
      Promise.resolve({ content: "not-a-number", provider: "mock", model: "test" }),
    ),
  } as unknown as AIClient;
}

function mockAiNumeric(): AIClient {
  return {
    generateWithSystem: vi.fn(() =>
      Promise.resolve({ content: "42", provider: "mock", model: "test" }),
    ),
  } as unknown as AIClient;
}

const numericConfig: CachedAIGeneratorConfig<number> = {
  systemPrompt: "Test",
  ttlMs: 60000,
  buildCacheKey: (s: string, t: string) => `${s}:${t}`,
  buildPrompt: (s: string, t: string) => `Gen ${s} ${t}`,
  parseResponse: (content: string) => {
    const n = Number(content);
    if (isNaN(n)) throw new Error("parse failed");
    return n;
  },
  emptyResult: 0,
  isEmpty: (result: number) => result === 0,
  getTable: (db: DataAccess) => ({
    get: (key: string) => db.knowledgeGraph.get(key),
    put: (entry: unknown) => db.knowledgeGraph.put(entry),
  }),
  buildCacheEntry: (key: string, data: number, ttlMs: number) => ({
    key,
    graph: data,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  }),
  extractData: (cached: unknown) => (cached as { graph: number }).graph,
  errorLabel: "NumericTest",
};

const testConfig: CachedAIGeneratorConfig<string> = {
  systemPrompt: "Test prompt",
  ttlMs: 60000,
  buildCacheKey: (subject: string, topic: string) => `${subject}:${topic}`,
  buildPrompt: (subject: string, topic: string) => `Generate for ${subject} ${topic}`,
  parseResponse: (content: string) => content,
  emptyResult: "",
  isEmpty: (result: string) => result === "",
  getTable: (db: DataAccess) => ({
    get: (key: string) => db.knowledgeGraph.get(key),
    put: (entry: unknown) => db.knowledgeGraph.put(entry),
  }),
  buildCacheEntry: (key: string, data: string, ttlMs: number) => ({
    key,
    graph: data,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  }),
  extractData: (cached: unknown) => (cached as { graph: string }).graph,
  errorLabel: "TestGenerator",
};

describe("CachedAIGenerator — Effect methods", () => {
  test("generateEffect returns parsed content on success", async () => {
    const gen = new CachedAIGenerator(testConfig, mockAi("hello world"), mockDb());
    const result = await Effect.runPromise(gen.generateEffect("math", "algebra"));
    expect(result).toBe("hello world");
  });

  test("generateEffect returns emptyResult on AI failure", async () => {
    const gen = new CachedAIGenerator(testConfig, mockAiEmpty(), mockDb());
    const result = await Effect.runPromise(gen.generateEffect("math", "algebra"));
    expect(result).toBe("");
  });

  test("generateEffect returns emptyResult on parse error", async () => {
    const gen = new CachedAIGenerator(numericConfig, mockAiParseError(), mockDb());
    const result = await Effect.runPromise(gen.generateEffect("math", "algebra"));
    expect(result).toBe(0);
  });

  test("generateEffect parses numeric responses correctly", async () => {
    const gen = new CachedAIGenerator(numericConfig, mockAiNumeric(), mockDb());
    const result = await Effect.runPromise(gen.generateEffect("math", "algebra"));
    expect(result).toBe(42);
  });

  test("generateEffect returns Effect with no error channel leakage (never throws)", async () => {
    const gen = new CachedAIGenerator(testConfig, mockAiEmpty(), mockDb());
    const eff: Effect.Effect<string> = gen.generateEffect("math", "algebra");
    const result = await Effect.runPromise(eff);
    expect(typeof result).toBe("string");
  });
});

describe("CachedAIGenerator — cache Effect methods", () => {
  test("getCachedEffect returns null on cache miss", async () => {
    const gen = new CachedAIGenerator(testConfig, mockAi("x"), mockDb());
    const result = await Effect.runPromise(gen.getCachedEffect("math", "nonexistent"));
    expect(result).toBeNull();
  });

  test("storeEffect persists then getCachedEffect retrieves", async () => {
    const gen = new CachedAIGenerator(testConfig, mockAi("x"), mockDb());
    await Effect.runPromise(gen.storeEffect("math", "algebra", "cached data"));
    const result = await Effect.runPromise(gen.getCachedEffect("math", "algebra"));
    expect(result).toBe("cached data");
  });
});

describe("CachedAIGenerator — fetchWithCacheEffect", () => {
  test("fetchWithCacheEffect returns cached value when available", async () => {
    const ai = mockAi("should not be called");
    const gen = new CachedAIGenerator(testConfig, ai, mockDb());
    await Effect.runPromise(gen.storeEffect("math", "algebra", "cached data"));
    const result = await Effect.runPromise(gen.fetchWithCacheEffect("math", "algebra"));
    expect(result).toBe("cached data");
    expect(ai.generateWithSystem).not.toHaveBeenCalled();
  });

  test("fetchWithCacheEffect generates and stores on cache miss", async () => {
    const ai = mockAi("generated data");
    const gen = new CachedAIGenerator(testConfig, ai, mockDb());
    const result = await Effect.runPromise(gen.fetchWithCacheEffect("math", "algebra"));
    expect(result).toBe("generated data");
    const cached = await Effect.runPromise(gen.getCachedEffect("math", "algebra"));
    expect(cached).toBe("generated data");
  });

  test("backward-compat async methods return same results", async () => {
    const gen = new CachedAIGenerator(testConfig, mockAi("async result"), mockDb());
    const [effectResult, asyncResult] = await Promise.all([
      Effect.runPromise(gen.generateEffect("math", "algebra")),
      gen.generate("math", "algebra"),
    ]);
    expect(effectResult).toBe(asyncResult);
  });
});
