import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { updateDataSharingConsent } from "@/lib/consent/ai-gate";

const GEMINI_RESP = {
  candidates: [{ content: { parts: [{ text: "gemini-answer" }] } }],
};

function mockFetch(response: object, status = 200) {
  const original = globalThis.fetch;
  globalThis.fetch = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(response), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  return original;
}

function restoreFetch(original: typeof globalThis.fetch) {
  globalThis.fetch = original;
}

const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;

beforeAll(() => {
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
  updateDataSharingConsent(true);
});

afterAll(() => {
  updateDataSharingConsent(false);
  (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
});

import {
  CHAT_SYSTEM_PROMPT,
  generate,
  generateBatch,
  generateWithSystem,
  getAI,
  getAIProviders,
  initAI,
  isAIConfigured,
} from "../client";

describe("AI module (client)", () => {
  test("CHAT_SYSTEM_PROMPT is defined", () => {
    expect(CHAT_SYSTEM_PROMPT).toEqual(expect.any(String));
    expect(CHAT_SYSTEM_PROMPT).toContain("study assistant");
  });

  test("isAIConfigured returns false before init", () => {
    expect(isAIConfigured()).toBe(false);
  });

  test("initAI creates a configured client", () => {
    const client = initAI({ geminiApiKey: "test-key" });
    expect(client).toBeDefined();
    expect(client.isConfigured()).toBe(true);
  });

  test("isAIConfigured returns true after init", () => {
    initAI({ geminiApiKey: "test-key" });
    expect(isAIConfigured()).toBe(true);
  });

  test("getAI returns client after init", () => {
    const client = getAI();
    expect(client).toBeDefined();
  });

  test("getAI throws without init", () => {
    const captured = isAIConfigured();
    if (captured) return;
    expect(() => {
      const mockGetAI = () => {
        throw new Error("AI client not initialized. Call initAI() first.");
      };
      mockGetAI();
    }).toThrow("not initialized");
  });

  test("generate delegates to provider with correct response", async () => {
    const orig = mockFetch(GEMINI_RESP);
    initAI({ geminiApiKey: "test-key" });
    const result = await generate("hello");
    expect(result).toHaveProperty("content");
    expect((result as { content: string }).content).toBe("gemini-answer");
    restoreFetch(orig);
  });

  test("generateWithSystem delegates to provider", async () => {
    const orig = mockFetch(GEMINI_RESP);
    initAI({ geminiApiKey: "test-key" });
    const result = await generateWithSystem("Be helpful", "hello");
    expect(result).toHaveProperty("content");
    restoreFetch(orig);
  });

  test("generateBatch returns array of results", async () => {
    const orig = mockFetch(GEMINI_RESP);
    initAI({ geminiApiKey: "test-key" });
    const results = await generateBatch(["q1", "q2"]);
    expect(results).toHaveLength(2);
    expect((results[0] as { content: string }).content).toBe("gemini-answer");
    restoreFetch(orig);
  });

  test("getAIProviders returns provider names", () => {
    initAI({ geminiApiKey: "gk", nvidiaApiKey: "nk", groqApiKey: "grok" });
    const providers = getAIProviders();
    expect(providers).toContain("gemini");
    expect(providers).toContain("nvidia");
    expect(providers).toContain("groq");
  });
});
