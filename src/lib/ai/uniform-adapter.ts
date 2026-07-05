import { generateText } from "ai";
import type { AIResponse } from "./types";
import type { GenerateOptions } from "./client";

export interface RequestNormalizer {
  normalize: (params: {
    model: unknown;
    prompt: string;
    systemPrompt?: string;
    imageUrl?: string;
    options?: GenerateOptions;
  }) => Record<string, unknown>;
}

export interface ResponseParser {
  parse: (raw: {
    text: string;
    usage?: { inputTokens?: number; outputTokens?: number };
    provider: string;
    model: string;
  }) => AIResponse;
}

export interface UniformProviderConfig {
  name: string;
  modelId: string;
  createModel: () => unknown;
  normalizer: RequestNormalizer;
  parser?: ResponseParser;
  supportsImages?: boolean;
  reasoning?: string;
  timeoutMs?: number;
}

const DEFAULT_PARSER: ResponseParser = {
  parse: (raw) => ({
    type: "success" as const,
    content: raw.text,
    provider: raw.provider,
    model: raw.model,
    inputTokens: raw.usage?.inputTokens,
    outputTokens: raw.usage?.outputTokens,
  }),
};

export function createUniformProvider(config: UniformProviderConfig) {
  const {
    name,
    modelId,
    createModel,
    normalizer,
    parser = DEFAULT_PARSER,
    reasoning,
    timeoutMs,
  } = config;
  const model = createModel();

  return {
    provider: name,
    model: modelId,
    modelRef: model as Parameters<typeof generateText>[0]["model"],
    generateText: async (
      prompt: string,
      systemPrompt?: string,
      imageUrl?: string,
      options?: GenerateOptions,
    ) => {
      const params = normalizer.normalize({ model, prompt, systemPrompt, imageUrl, options });
      const { text, usage } = await generateText({
        ...params,
        ...(reasoning ? { reasoning: reasoning as never } : {}),
        ...(timeoutMs ? { timeout: timeoutMs } : {}),
        telemetry: {
          isEnabled: true,
          recordInputs: false,
          recordOutputs: false,
          functionId: "ai.generate",
        },
      } as Parameters<typeof generateText>[0]);
      return parser.parse({ text, usage, provider: name, model: modelId });
    },
  };
}

export const geminiNormalizer: RequestNormalizer = {
  normalize: ({ model, prompt, systemPrompt, imageUrl, options }) => {
    const messages: {
      role: "user";
      content: Array<{ type: "text"; text: string } | { type: "image"; image: string }>;
    }[] = [{ role: "user", content: [{ type: "text", text: prompt }] }];
    if (imageUrl) {
      messages[0].content.push({ type: "image", image: imageUrl });
    }
    return {
      model,
      messages,
      system: systemPrompt,
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxOutputTokens ?? options?.maxTokens ?? 2048,
    };
  },
};

export const openaiNormalizer: RequestNormalizer = {
  normalize: ({ model, prompt, systemPrompt, options }) => ({
    model,
    system: systemPrompt,
    prompt,
    temperature: options?.temperature ?? 0.7,
    maxOutputTokens: options?.maxOutputTokens ?? options?.maxTokens ?? 2048,
  }),
};
