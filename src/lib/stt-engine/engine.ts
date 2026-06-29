import { logError } from "@/lib/shared/logger";
import { buildCacheKey, cacheSTTResult, getCachedSTTResult } from "./cache";
import { trackSTTUsage } from "./cost-tracker";
import {
  createBrowserNativeProvider,
  createDeepgramProvider,
  createWhisperWasmProvider,
} from "./providers";
import type { AudioInput, STTOptions, STTProvider, STTResult, STTUsageReport } from "./types";

export interface STTEngine {
  transcribe(audio: AudioInput, options?: STTOptions): Promise<STTResult>;
  transcribeWithFallback(audio: AudioInput, options?: STTOptions): Promise<STTResult>;
  getCostEstimate(durationSeconds: number, provider: string): number;
  getUsageReport(): Promise<STTUsageReport>;
}

export function createSTTEngine(providers?: STTProvider[]): STTEngine {
  const defaultProviders: STTProvider[] = providers ?? [
    createDeepgramProvider(),
    createBrowserNativeProvider(),
    createWhisperWasmProvider(),
  ];

  async function transcribe(audio: AudioInput, options?: STTOptions): Promise<STTResult> {
    const cacheKey = buildCacheKey(audio, options?.language);
    const cached = await getCachedSTTResult(cacheKey);
    if (cached) return cached;

    const providerName = options?.model === "whisper-large-v3" ? "whisper-wasm" : "deepgram";
    const provider = defaultProviders.find((p) => p.name === providerName) ?? defaultProviders[0];

    const result = await provider.transcribe(audio, options);

    await cacheSTTResult(cacheKey, result);
    await trackSTTUsage(provider.name, result.duration);

    return result;
  }

  async function transcribeWithFallback(
    audio: AudioInput,
    options?: STTOptions,
  ): Promise<STTResult> {
    const cacheKey = buildCacheKey(audio, options?.language);
    const cached = await getCachedSTTResult(cacheKey);
    if (cached) return cached;

    for (const provider of defaultProviders) {
      try {
        const result = await provider.transcribe(audio, options);
        if (result.text && result.text.length > 0) {
          await cacheSTTResult(cacheKey, result);
          await trackSTTUsage(provider.name, result.duration);
          return result;
        }
      } catch (err) {
        logError(`STT.${provider.name}`, err);
      }
    }

    return { text: "", confidence: 0, duration: 0, provider: "none" };
  }

  function getCostEstimate(durationSeconds: number, provider: string): number {
    const costs: Record<string, number> = {
      deepgram: 0.0043,
      "browser-native": 0,
      "whisper-wasm": 0,
    };
    return (durationSeconds / 60) * (costs[provider] ?? 0);
  }

  return {
    transcribe,
    transcribeWithFallback,
    getCostEstimate,
    getUsageReport: () => import("./cost-tracker").then((m) => m.getSTTUsageReport()),
  };
}
