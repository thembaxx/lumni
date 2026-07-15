import { createRouteHandler } from "@/lib/api/create-route-handler";
import { createSTTEngine } from "@/lib/stt-engine";
import { logError } from "@/lib/shared/logger";

export const POST = createRouteHandler({
  auth: "required",
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
    try {
      const engine = createSTTEngine();
      const buffer = Buffer.from(body.audio, "base64");
      const blob = new Blob([buffer], { type: body.format || "audio/webm" });
      return await engine.transcribeWithFallback(
        { blob, sampleRate: 16000, channels: 1 },
        { language: body.language ?? "en-ZA" },
      );
    } catch (err) {
      logError("Transcribe", err);
      return { text: null, confidence: null, provider: null };
    }
  },
});
