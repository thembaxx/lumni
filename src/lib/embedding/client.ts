import { trackAILatency } from "@/lib/ai/latency-tracker";
import { logError } from "@/lib/shared/logger";
import type { EmbeddingResponse } from "./types";

const MODEL = "gemini-embedding-exp-03-07";
const DIMENSIONS = 512;

export async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent?key=${apiKey}`;

  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${MODEL}`,
        content: { parts: [{ text: text.slice(0, 3000) }] },
        outputDimensionality: DIMENSIONS,
      }),
    });

    const durationMs = Math.round(performance.now() - start);
    trackAILatency({
      provider: "gemini",
      durationMs,
      success: res.ok,
      callType: "embed",
      timestamp: new Date().toISOString(),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as EmbeddingResponse;
    return data.embedding.values;
  } catch (err) {
    logError("EmbedText", err);
    return null;
  }
}
