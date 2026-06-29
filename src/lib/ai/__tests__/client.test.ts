import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { updateDataSharingConsent } from "@/lib/consent/ai-gate";
import { AIClient } from "../client";

const originalFetch = globalThis.fetch;
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
  globalThis.fetch = originalFetch;
  (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
});

describe("AIClient", () => {
  test("isConfigured returns false with no config", () => {
    const client = new AIClient({});
    expect(client.isConfigured()).toBe(false);
  });

  test("generate returns failure when no providers configured", async () => {
    const client = new AIClient({});
    const result = await client.generate("test");
    expect(result).toHaveProperty("error");
    expect((result as { available: boolean }).available).toBe(false);
  });

  test("generateWithSystem returns failure when no providers configured", async () => {
    const client = new AIClient({});
    const result = await client.generateWithSystem("system", "user");
    expect(result).toHaveProperty("error");
    expect((result as { available: boolean }).available).toBe(false);
  });

  test("generateBatch returns per-item results", async () => {
    const client = new AIClient({});
    const results = await client.generateBatch(["a", "b"]);
    expect(results).toHaveLength(2);
  });

  test("getProviders returns empty when unconfigured", () => {
    const client = new AIClient({});
    expect(client.getProviders()).toEqual([]);
  });

  test("getProviders includes nvidia when nvidiaApiKey is set", () => {
    const client = new AIClient({ nvidiaApiKey: "nvapi-test" });
    expect(client.getProviders()).toContain("nvidia");
  });

  test("isConfigured returns true with only nvidiaApiKey", () => {
    const client = new AIClient({ nvidiaApiKey: "nvapi-test" });
    expect(client.isConfigured()).toBe(true);
  });

  test("provider order is gemini, nvidia, groq when all configured", () => {
    const client = new AIClient({
      geminiApiKey: "gemini-key",
      nvidiaApiKey: "nvapi-key",
      groqApiKey: "groq-key",
    });
    expect(client.getProviders()).toEqual(["gemini", "nvidia", "groq"]);
  });

  test("generate delegates to provider", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            id: "chatcmpl-test",
            object: "chat.completion",
            created: 1717000000,
            model: "meta/llama-3.3-70b-instruct",
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: "Hello from provider" },
                finish_reason: "stop",
              },
            ],
            usage: { prompt_tokens: 5, completion_tokens: 3 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    ) as unknown as typeof globalThis.fetch;

    const client = new AIClient({ nvidiaApiKey: "nv-test" });
    const result = await client.generate("test prompt");

    expect(result.error).toBeUndefined();
    expect(result.content).toBe("Hello from provider");
    expect(result.provider).toBe("nvidia");
  });
});
