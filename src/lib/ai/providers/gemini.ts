import { logError } from "@/lib/shared/logger";
import type { AIProvider, AIRequest } from "../types";
import { createUniformProvider, geminiResponseParser } from "../uniform-adapter";

async function geminiWithImagesNormalizer(request: AIRequest): Promise<Record<string, unknown>> {
  const contents = await Promise.all(
    request.messages.map(async (m) => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: m.content },
      ];

      if (m.imageUrl) {
        try {
          const imageResponse = await fetch(m.imageUrl);
          if (imageResponse.ok) {
            const buffer = await imageResponse.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
            parts.push({
              inlineData: { mimeType: contentType, data: base64 },
            });
          }
        } catch (e) {
          logError("Gemini.FetchImage", e);
        }
      }

      return { role: m.role === "model" ? "model" : "user", parts };
    }),
  );

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

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export function createGeminiProvider(apiKey: string): AIProvider {
  const model = "gemini-2.0-flash-lite-001";
  return createUniformProvider({
    name: "gemini",
    model,
    url: `${GEMINI_URL}/${model}:generateContent`,
    apiKey,
    authScheme: "x-goog-api-key",
    capabilities: { systemPrompt: true, images: true },
    normalizeRequest: geminiWithImagesNormalizer,
    parseResponse: geminiResponseParser,
  });
}
