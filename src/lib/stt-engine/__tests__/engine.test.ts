import { describe, expect, test, vi } from "vitest";
import type { STTProvider, STTResult } from "../types";

vi.mock("../cache", () => ({
  getCachedSTTResult: vi.fn(async () => undefined),
  cacheSTTResult: vi.fn(async () => {}),
  buildCacheKey: vi.fn(() => "test-key"),
}));

vi.mock("../cost-tracker", () => ({
  trackSTTUsage: vi.fn(async () => {}),
  getSTTUsageReport: vi.fn(async () => ({
    totalMinutes: 0,
    totalCost: 0,
    byProvider: [],
    byDate: [],
  })),
}));

const { createSTTEngine } = await import("../engine");

describe("STTEngine", () => {
  test("createSTTEngine returns an engine with all methods", () => {
    const engine = createSTTEngine([]);
    expect(engine).toBeDefined();
    expect(typeof engine.transcribe).toBe("function");
    expect(typeof engine.transcribeWithFallback).toBe("function");
    expect(typeof engine.getCostEstimate).toBe("function");
    expect(typeof engine.getUsageReport).toBe("function");
  });

  test("getCostEstimate returns 0 for free providers", () => {
    const engine = createSTTEngine([]);
    expect(engine.getCostEstimate(60, "browser-native")).toBe(0);
    expect(engine.getCostEstimate(60, "whisper-wasm")).toBe(0);
  });

  test("getCostEstimate calculates Deepgram cost correctly", () => {
    const engine = createSTTEngine([]);
    const cost = engine.getCostEstimate(60, "deepgram");
    expect(cost).toBeCloseTo(0.0043, 6);
  });

  test("getCostEstimate returns 0 for unknown provider", () => {
    const engine = createSTTEngine([]);
    expect(engine.getCostEstimate(60, "unknown")).toBe(0);
  });

  test("transcribeWithFallback returns empty result when all providers fail", async () => {
    const failingProvider: STTProvider = {
      name: "failing",
      capabilities: { streaming: false, languages: [], offline: true, costPerMinute: 0 },
      transcribe: async () => {
        throw new Error("always fails");
      },
    };
    const engine = createSTTEngine([failingProvider]);
    const result = await engine.transcribeWithFallback({
      blob: new Float32Array(16000),
      sampleRate: 16000,
      channels: 1,
    });
    expect(result.text).toBe("");
    expect(result.provider).toBe("none");
  });

  test("transcribeWithFallback returns result from first provider that succeeds", async () => {
    const failProvider: STTProvider = {
      name: "fail",
      capabilities: { streaming: false, languages: [], offline: true, costPerMinute: 0 },
      transcribe: async () => {
        throw new Error("fail");
      },
    };
    const successProvider: STTProvider = {
      name: "success",
      capabilities: { streaming: false, languages: [], offline: true, costPerMinute: 0 },
      transcribe: async () =>
        ({
          text: "hello world",
          confidence: 0.95,
          duration: 2,
          provider: "success",
        }) as STTResult,
    };
    const engine = createSTTEngine([failProvider, successProvider]);
    const result = await engine.transcribeWithFallback({
      blob: new Float32Array(16000),
      sampleRate: 16000,
      channels: 1,
    });
    expect(result.text).toBe("hello world");
    expect(result.provider).toBe("success");
  });

  test("transcribe picks deepgram provider by default", async () => {
    let capturedProvider = "";
    const provider: STTProvider = {
      name: "deepgram",
      capabilities: { streaming: false, languages: [], offline: true, costPerMinute: 0.0043 },
      transcribe: async () => {
        capturedProvider = "deepgram";
        return { text: "ok", confidence: 0.9, duration: 1, provider: "deepgram" } as STTResult;
      },
    };
    const engine = createSTTEngine([provider]);
    const result = await engine.transcribe({
      blob: new Float32Array(16000),
      sampleRate: 16000,
      channels: 1,
    });
    expect(result.text).toBe("ok");
    expect(capturedProvider).toBe("deepgram");
  });
});
