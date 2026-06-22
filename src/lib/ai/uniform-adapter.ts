import type { AIProvider, AIRequest, AIResponse } from "./types";

export interface ProviderConfig {
  name: string;
  model: string;
  url: string;
  apiKey: string;
  authScheme: "bearer" | "x-goog-api-key";
  capabilities?: { systemPrompt?: boolean; images?: boolean };
  normalizeRequest: (
    request: AIRequest,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>;
  parseResponse: (data: Record<string, unknown>) => {
    content: string;
    inputTokens?: number;
    outputTokens?: number;
  };
}

export function createUniformProvider(config: ProviderConfig): AIProvider {
  const displayName = config.name.charAt(0).toUpperCase() + config.name.slice(1);

  return {
    name: config.name,
    model: config.model,
    capabilities: config.capabilities,
    async generate(request: AIRequest): Promise<AIResponse> {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (config.authScheme === "bearer") {
        headers.Authorization = `Bearer ${config.apiKey}`;
      } else {
        headers["x-goog-api-key"] = config.apiKey;
      }

      const body = await config.normalizeRequest(request);

      const response = await fetch(config.url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${displayName} API error: ${response.status} - ${error}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      const parsed = config.parseResponse(data);

      return {
        content: parsed.content,
        provider: config.name,
        model: config.model,
        inputTokens: parsed.inputTokens,
        outputTokens: parsed.outputTokens,
      };
    },
  };
}

// --- Normalizers ---

export function openaiNormalizer(request: AIRequest): Record<string, unknown> {
  const messages: Array<{ role: string; content: string }> = request.messages.map((m) => ({
    role: m.role === "model" ? "assistant" : m.role,
    content: m.content,
  }));

  if (request.systemPrompt) {
    messages.unshift({ role: "system", content: request.systemPrompt });
  }

  return {
    model: "",
    messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.maxTokens ?? 2048,
  };
}

function _geminiNormalizer(request: AIRequest): Record<string, unknown> {
  const contents = request.messages.map((m) => ({
    role: m.role === "model" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: request.temperature ?? 0.7,
      maxOutputTokens: request.maxTokens ?? 2048,
      topP: 0.95,
      topK: 40,
    },
  };

  if (request.systemPrompt) {
    body.system_instruction = {
      parts: [{ text: request.systemPrompt }],
    };
  }

  return body;
}

// --- Response Parsers ---

export function openaiResponseParser(data: Record<string, unknown>) {
  const choices = data.choices as Array<{ message: { content: string } }> | undefined;
  const content = choices?.[0]?.message?.content ?? "";
  const usage = data.usage as Record<string, unknown> | undefined;
  return {
    content,
    inputTokens: (usage?.prompt_tokens as number) ?? undefined,
    outputTokens: (usage?.completion_tokens as number) ?? undefined,
  };
}

export function geminiResponseParser(data: Record<string, unknown>) {
  const candidates = data.candidates as
    | Array<{ content: { parts: Array<{ text: string }> } }>
    | undefined;
  const content = candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return { content };
}
