import type { AIProvider } from "../types";
import { createUniformProvider, openaiNormalizer, openaiResponseParser } from "../uniform-adapter";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export function createGroqProvider(apiKey: string): AIProvider {
  const model = "llama-3.3-70b-versatile";
  return createUniformProvider({
    name: "groq",
    model,
    url: GROQ_URL,
    apiKey,
    authScheme: "bearer",
    capabilities: { systemPrompt: true, images: false },
    normalizeRequest: (req) => ({
      ...openaiNormalizer(req),
      model,
    }),
    parseResponse: openaiResponseParser,
  });
}
