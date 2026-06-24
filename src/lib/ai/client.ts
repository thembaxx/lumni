import { Effect } from "effect";
import { getAICallContext } from "@/lib/ai/call-context";
import { getDataSharingConsent } from "@/lib/consent/ai-gate";
import { logError } from "@/lib/shared/logger";
import { trackAILatency } from "./latency-tracker";
import { createGeminiProvider } from "./providers/gemini";
import { createGroqProvider } from "./providers/groq";
import { createNvidiaProvider } from "./providers/nvidia";
import type { AIFailure, AIProvider, AIRequest, AIResponse, AIResult } from "./types";

export interface AIConfig {
  geminiApiKey?: string;
  nvidiaApiKey?: string;
  groqApiKey?: string;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
}

const FAILURE_RESPONSE: AIFailure = {
  error: "All AI providers failed",
  provider: "none",
  available: false,
};

class ProviderCallError {
  readonly _tag = "ProviderCallError";
  constructor(readonly message: string, readonly provider: string) {}
}

function createProviderChain(config: AIConfig): AIProvider[] {
  const providers: AIProvider[] = [];

  if (config.geminiApiKey) {
    providers.push(createGeminiProvider(config.geminiApiKey));
  }
  if (config.nvidiaApiKey) {
    providers.push(createNvidiaProvider(config.nvidiaApiKey));
  }
  if (config.groqApiKey) {
    providers.push(createGroqProvider(config.groqApiKey));
  }
  return providers;
}

function checkConsentEffect(): Effect.Effect<void> {
  return Effect.sync(() => {
    const consent = getAICallContext()?.consentGranted ?? getDataSharingConsent();
    if (!consent) {
      throw new Error("Data sharing consent not granted");
    }
  });
}

function callProviderEffect(
  provider: AIProvider,
  request: AIRequest,
  callType: "generate" | "grade" | "hint" | "visual" | "embed" = "generate",
): Effect.Effect<AIResponse, ProviderCallError> {
  return Effect.tryPromise({
    try: async () => {
      const start = performance.now();
      const response = await provider.generate(request);
      const durationMs = Math.round(performance.now() - start);
      trackAILatency({
        provider: provider.name,
        durationMs,
        success: true,
        callType,
        timestamp: new Date().toISOString(),
      });
      return response;
    },
    catch: (err): ProviderCallError => {
      const durationMs = 0;
      const lastError = err instanceof Error ? err.message : String(err);
      trackAILatency({
        provider: provider.name,
        durationMs,
        success: false,
        callType,
        timestamp: new Date().toISOString(),
      });
      logError("AiClientCallProvider", err);
      const isRateLimit = /429|RESOURCE_EXHAUSTED/.test(lastError);
      if (isRateLimit) {
        console.warn(`[AI] Provider ${provider.name} rate-limited, trying next...`);
      } else {
        console.error(`[AI] Provider failed: ${provider.name}`, lastError);
      }
      return new ProviderCallError(lastError, provider.name);
    },
  });
}

export class AIClient {
  private providers: AIProvider[];

  constructor(config: AIConfig) {
    this.providers = createProviderChain(config);
  }

  private callProvidersEffect(
    request: AIRequest,
    callType: "generate" | "grade" | "hint" | "visual" | "embed" = "generate",
  ): Effect.Effect<AIResponse, AIFailure> {
    const self = this;
    return Effect.gen(function* () {
      yield* checkConsentEffect();

      if (self.providers.length === 0) {
        return yield* Effect.fail({ ...FAILURE_RESPONSE, error: "No AI providers configured" });
      }

      let lastError = "";

      for (const provider of self.providers) {
        const result = yield* callProviderEffect(provider, request, callType).pipe(
          Effect.catchAll((err: ProviderCallError) => {
            lastError = err.message;
            return Effect.succeed(null);
          }),
        );

        if (result !== null) {
          return result;
        }
      }

      return yield* Effect.fail({
        ...FAILURE_RESPONSE,
        error: `All providers failed. Last error: ${lastError}`,
      } as AIFailure);
    });
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResult> {
    return Effect.runPromise(
      this.callProvidersEffect(
        {
          messages: [{ role: "user", content: prompt }],
          temperature: options?.temperature ?? 0.7,
          maxTokens: options?.maxTokens ?? 2048,
        },
        "generate",
      ).pipe(Effect.catchAll((failure) => Effect.succeed(failure as AIResult))),
    );
  }

  async generateWithSystem(
    systemPrompt: string,
    userPrompt: string,
    options?: GenerateOptions & { imageUrl?: string },
  ): Promise<AIResult> {
    return Effect.runPromise(
      this.callProvidersEffect(
        {
          messages: [{ role: "user", content: userPrompt, imageUrl: options?.imageUrl }],
          systemPrompt,
          temperature: options?.temperature ?? 0.7,
          maxTokens: options?.maxTokens ?? 2048,
        },
        "generate",
      ).pipe(Effect.catchAll((failure) => Effect.succeed(failure as AIResult))),
    );
  }

  async generateBatch(prompts: string[], options?: GenerateOptions): Promise<AIResult[]> {
    const effects = prompts.map((prompt) =>
      this.callProvidersEffect(
        {
          messages: [{ role: "user", content: prompt }],
          temperature: options?.temperature ?? 0.7,
          maxTokens: options?.maxTokens ?? 2048,
        },
        "generate",
      ).pipe(
        Effect.catchAll((failure) => Effect.succeed(failure as AIResult)),
        Effect.runPromise,
      ),
    );
    return Promise.all(effects);
  }

  isConfigured(): boolean {
    return this.providers.length > 0;
  }

  getProviders(): string[] {
    return this.providers.map((p) => p.name);
  }
}

let globalClient: AIClient | null = null;

export function initAI(config: AIConfig): AIClient {
  globalClient = new AIClient(config);
  return globalClient;
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
