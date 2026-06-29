import { createRouteHandler } from "@/lib/api/create-route-handler";
import { createSTTEngine } from "@/lib/stt-engine";
import { logError } from "@/lib/shared/logger";

export const POST = createRouteHandler({
  auth: "none",
  errorLabel: "Transcribe",
  useRateLimit: true,
  parseBody: async (req) => {
    const body: { audio: string; format?: string; language?: string } = await req.json();
    return body;
  },
  validate: (body) => {
    if (!body.audio || typeof body.audio !== "string" || body.audio.length === 0)
      return "audio is required";
    return null;
  },
  execute: async ({ body }) => {
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      try {
        const engine = createSTTEngine();
        const buffer = Buffer.from(body.audio, "base64");
        const blob = new Blob([buffer], { type: body.format || "audio/webm" });
        return await engine.transcribeWithFallback(
          { blob, sampleRate: 16000, channels: 1 },
          { language: body.language ?? "en-ZA" },
        );
      } catch (err) {
        logError("Transcribe.fallback", err);
        return { text: null, confidence: null, provider: null };
      }
    }

    try {
      const audioBuffer = Buffer.from(body.audio, "base64");
      const format = body.format || "audio/webm";

      const response = await fetch("https://api.deepgram.com/v1/listen", {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": format,
        },
        body: audioBuffer,
      });

      if (!response.ok) {
        logError("Transcribe.deepgram", new Error(`Status ${response.status}`));
        return { text: null, confidence: null, provider: null };
      }

      const data = await response.json();
      const channel = data.results?.channels?.[0];
      const alternative = channel?.alternatives?.[0];

      return {
        text: alternative?.transcript ?? null,
        confidence: alternative?.confidence ?? null,
        provider: "deepgram",
      };
    } catch (err) {
      logError("Transcribe.deepgram", err);
      return { text: null, confidence: null, provider: null };
    }
  },
});
