import type { AIProvider } from "../types";
import { createUniformProvider, openaiNormalizer, openaiResponseParser } from "../uniform-adapter";

const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export function createNvidiaProvider(apiKey: string): AIProvider {
  const model = "meta/llama-3.3-70b-instruct";
  return createUniformProvider({
    name: "nvidia",
    model,
    url: NVIDIA_URL,
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
