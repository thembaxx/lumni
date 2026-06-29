import { embed } from "ai";
import { createGoogle } from "@ai-sdk/google";
import { trackAILatency } from "@/lib/ai/latency-tracker";
import { makeTelemetryOptions } from "@/lib/ai/client";
import { logError } from "@/lib/shared/logger";

let googleProvider: ReturnType<typeof createGoogle> | null = null;

function getGoogleProvider() {
  if (!googleProvider) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    googleProvider = createGoogle({ apiKey });
  }
  return googleProvider;
}

export async function embedText(text: string): Promise<number[] | null> {
  const provider = getGoogleProvider();
  if (!provider) return null;

  const start = performance.now();
  try {
    const { embedding } = await embed({
      model: provider.embeddingModel("text-embedding-004"),
      value: text.slice(0, 3000),
      telemetry: makeTelemetryOptions("ai.embed"),
    });
    const durationMs = Math.round(performance.now() - start);
    trackAILatency({
      provider: "gemini",
      durationMs,
      success: true,
      callType: "embed",
      timestamp: new Date().toISOString(),
    });
    return embedding;
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    trackAILatency({
      provider: "gemini",
      durationMs,
      success: false,
      callType: "embed",
      timestamp: new Date().toISOString(),
    });
    logError("EmbedText", err);
    return null;
  }
}
