import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { logError } from "@/lib/shared/logger";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

const FREE_TTS_API_URL = "https://api.freetts.org/v1/synthesizes";

export const POST = withRateLimit(
	createRouteHandler({
		auth: "required",
		validate: (body: Record<string, unknown>) => {
			const { text } = body as { text?: string };
			if (!text || typeof text !== "string" || text.trim().length === 0)
				return "Text is required";
			return null;
		},
		execute: async ({ body }) => {
			const { text, voice, lang } = body as {
				text: string;
				voice?: string;
				lang?: string;
			};

			const truncatedText = text.slice(0, 1000);

			const response = await fetch(FREE_TTS_API_URL, {
				method: "POST",
				cache: "no-store",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text: truncatedText,
					voice: voice || "en_us_guy",
					lang: lang || "en",
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				logError(
					"TTS",
					new Error(`FreeTTS API error ${response.status}: ${errorText}`),
				);
				throw new HttpError(503, "TTS service unavailable");
			}

			const audioBuffer = await response.arrayBuffer();
			const audioBase64 = Buffer.from(audioBuffer).toString("base64");

			return { audio: audioBase64, format: "mp3" };
		},
		errorLabel: "TTS",
	}),
	{ max: 5, windowMs: 60000 },
);
