import { generateText, registerTelemetry } from "ai";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { OpenTelemetry } from "@ai-sdk/otel";
import { getAICallContext } from "@/lib/ai/call-context";
import { getDataSharingConsent } from "@/lib/consent/ai-gate";
import { logError } from "@/lib/shared/logger";
import { trackAILatency } from "./latency-tracker";
import type { AIResponse, AIResult, AIFailure } from "./types";

export interface AIConfig {
  geminiApiKey?: string;
  nvidiaApiKey?: string;
  groqApiKey?: string;
  /** @default "gemini-2.0-flash-lite-001" */
  geminiModel?: string;
  /** @default "meta/llama-3.3-70b-instruct" */
  nvidiaModel?: string;
  /** @default "llama-3.3-70b-versatile" */
  groqModel?: string;
  /** Reasoning effort: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' */
  reasoning?: string;
  /** Timeout in milliseconds for each AI call */
  timeoutMs?: number;
}

export interface GenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
  /** @deprecated Use maxOutputTokens */
  maxTokens?: number;
}

interface ProviderModel {
  provider: string;
  model: string;
  modelRef: Parameters<typeof generateText>[0]["model"];
  generateText: (
    prompt: string,
    systemPrompt?: string,
    imageUrl?: string,
    options?: GenerateOptions,
  ) => Promise<AIResponse>;
}

const FAILURE_RESPONSE: AIFailure = {
  error: "All AI providers failed",
  provider: "none",
  available: false,
};

function createProviderModels(config: AIConfig): ProviderModel[] {
  const providers: ProviderModel[] = [];

  if (config.geminiApiKey) {
    const google = createGoogle({ apiKey: config.geminiApiKey });
    const modelId = config.geminiModel ?? "gemini-2.0-flash-lite-001";
    const model = google(modelId);
    providers.push({
      provider: "gemini",
      model: modelId,
      modelRef: model,
      generateText: async (prompt, systemPrompt, imageUrl, options) => {
        const messages: {
          role: "user";
          content: Array<{ type: "text"; text: string } | { type: "image"; image: string }>;
        }[] = [{ role: "user", content: [{ type: "text", text: prompt }] }];
        if (imageUrl) {
          messages[0].content.push({ type: "image", image: imageUrl });
        }
        const { text, usage } = await generateText({
          model,
          messages,
          system: systemPrompt,
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? options?.maxTokens ?? 2048,
          ...(config.reasoning ? { reasoning: config.reasoning as never } : {}),
          ...(config.timeoutMs ? { timeout: config.timeoutMs } : {}),
          telemetry: makeTelemetryOptions("ai.generate"),
        });
        return {
          content: text,
          provider: "gemini",
          model: modelId,
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
        };
      },
    });
  }

  if (config.nvidiaApiKey) {
    const nvidia = createOpenAI({
      apiKey: config.nvidiaApiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
      name: "nvidia",
    });
    const modelId = config.nvidiaModel ?? "meta/llama-3.3-70b-instruct";
    providers.push({
      provider: "nvidia",
      model: modelId,
      modelRef: nvidia.chat(modelId),
      generateText: async (prompt, systemPrompt, _imageUrl, options) => {
        const { text, usage } = await generateText({
          model: nvidia.chat(modelId),
          system: systemPrompt,
          prompt,
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? options?.maxTokens ?? 2048,
          ...(config.reasoning ? { reasoning: config.reasoning as never } : {}),
          ...(config.timeoutMs ? { timeout: config.timeoutMs } : {}),
          telemetry: makeTelemetryOptions("ai.generate"),
        });
        return {
          content: text,
          provider: "nvidia",
          model: modelId,
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
        };
      },
    });
  }

  if (config.groqApiKey) {
    const groq = createOpenAI({
      apiKey: config.groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
      name: "groq",
    });
    const modelId = config.groqModel ?? "llama-3.3-70b-versatile";
    providers.push({
      provider: "groq",
      model: modelId,
      modelRef: groq.chat(modelId),
      generateText: async (prompt, systemPrompt, _imageUrl, options) => {
        const { text, usage } = await generateText({
          model: groq.chat(modelId),
          system: systemPrompt,
          prompt,
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? options?.maxTokens ?? 2048,
          ...(config.reasoning ? { reasoning: config.reasoning as never } : {}),
          ...(config.timeoutMs ? { timeout: config.timeoutMs } : {}),
          telemetry: makeTelemetryOptions("ai.generate"),
        });
        return {
          content: text,
          provider: "groq",
          model: modelId,
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
        };
      },
    });
  }

  return providers;
}

export class AIClient {
  private providers: ProviderModel[];

  constructor(config: AIConfig) {
    this.providers = createProviderModels(config);
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResult> {
    return this.callWithFallback(prompt, undefined, undefined, options);
  }

  async generateWithSystem(
    systemPrompt: string,
    userPrompt: string,
    options?: GenerateOptions & { imageUrl?: string },
  ): Promise<AIResult> {
    return this.callWithFallback(userPrompt, systemPrompt, options?.imageUrl, options);
  }

  async generateBatch(prompts: string[], options?: GenerateOptions): Promise<AIResult[]> {
    return Promise.all(prompts.map((p) => this.generate(p, options)));
  }

  /** Returns the first configured model reference for use with `generateObject` from `ai`. */
  getModelRef(): { model: Parameters<typeof generateText>[0]["model"] } | null {
    if (this.providers.length === 0) return null;
    const p = this.providers[0];
    return { model: p.modelRef };
  }

  isConfigured(): boolean {
    return this.providers.length > 0;
  }

  getProviders(): string[] {
    return this.providers.map((p) => p.provider);
  }

  private async callWithFallback(
    prompt: string,
    systemPrompt?: string,
    imageUrl?: string,
    options?: GenerateOptions,
  ): Promise<AIResult> {
    const consent = getAICallContext()?.consentGranted ?? getDataSharingConsent();
    if (!consent) {
      return { ...FAILURE_RESPONSE, error: "Data sharing consent not granted" };
    }

    if (this.providers.length === 0) {
      return { ...FAILURE_RESPONSE, error: "No AI providers configured" };
    }

    let lastError = "";

    for (const provider of this.providers) {
      const start = performance.now();
      try {
        const response = await provider.generateText(prompt, systemPrompt, imageUrl, options);
        const durationMs = Math.round(performance.now() - start);
        trackAILatency({
          provider: provider.provider,
          durationMs,
          success: true,
          callType: "generate",
          timestamp: new Date().toISOString(),
        });
        return response;
      } catch (err) {
        const durationMs = Math.round(performance.now() - start);
        const errorMsg = err instanceof Error ? err.message : String(err);
        lastError = errorMsg;
        trackAILatency({
          provider: provider.provider,
          durationMs,
          success: false,
          callType: "generate",
          timestamp: new Date().toISOString(),
        });
        logError(`AI.providerFailed.${provider.provider}`, err);
        const isRateLimit = /429|RESOURCE_EXHAUSTED/.test(errorMsg);
        if (isRateLimit) {
          logError(`AI.rateLimited.${provider.provider}`, err);
        }
      }
    }

    return {
      ...FAILURE_RESPONSE,
      error: `All providers failed. Last error: ${lastError}`,
    } as AIFailure;
  }
}

let telemetryRegistered = false;

let globalClient: AIClient | null = null;

export function initAI(config: AIConfig): AIClient {
  if (!telemetryRegistered) {
    try {
      registerTelemetry(new OpenTelemetry({ usage: true }));
      telemetryRegistered = true;
    } catch {
      /* telemetry already registered or unavailable */
    }
  }
  globalClient = new AIClient(config);
  return globalClient;
}

export function makeTelemetryOptions(functionId: string) {
  return { isEnabled: true, recordInputs: false, recordOutputs: false, functionId };
}

export function getAI(): AIClient {
  if (!globalClient) {
    throw new Error("AI client not initialized. Call initAI() first.");
  }
  return globalClient;
}

export async function generate(prompt: string, options?: GenerateOptions): Promise<AIResult> {
  return getAI().generate(prompt, options);
}

export async function generateWithSystem(
  systemPrompt: string,
  userPrompt: string,
  options?: GenerateOptions & { imageUrl?: string },
): Promise<AIResult> {
  return getAI().generateWithSystem(systemPrompt, userPrompt, options);
}

export async function generateBatch(
  prompts: string[],
  options?: GenerateOptions,
): Promise<AIResult[]> {
  return getAI().generateBatch(prompts, options);
}

export function isAIConfigured(): boolean {
  return globalClient?.isConfigured() ?? false;
}

export function getAIProviders(): string[] {
  return globalClient?.getProviders() ?? [];
}

export const CHAT_SYSTEM_PROMPT = `You are a helpful study assistant and tutor. Your role is to help students understand their subjects, answer questions, explain concepts, and provide guidance on their studies. Be friendly, encouraging, and patient. Use clear explanations with examples when helpful. If you don't know something, admit it and try to help them find the answer.`;
