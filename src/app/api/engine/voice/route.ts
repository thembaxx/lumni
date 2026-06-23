import { createRouteHandler } from "@/lib/api/create-route-handler";
import { voiceEngine } from "@/lib/voice-engine";

export const POST = createRouteHandler({
  auth: "none",
  errorLabel: "Voice",
  useRateLimit: true,
  aiContext: { consentGranted: true },
  parseBody: async (req) => {
    const body: { text: string; options?: Record<string, unknown> } = await req.json();
    return body;
  },
  validate: (body) => {
    if (!body.text || typeof body.text !== "string" || body.text.trim().length === 0)
      return "text is required";
    return null;
  },
  execute: async ({ body }) => {
    const result = await voiceEngine.synthesize(body.text, body.options as Record<string, unknown>);
    if (!result) {
      return { audio: null, format: null, provider: null };
    }
    return result;
  },
});
