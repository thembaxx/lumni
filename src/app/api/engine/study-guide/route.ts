import { initAI, isAIConfigured } from "@/lib/ai/client";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import {
	generateGuide,
	getCachedGuide,
	storeGuide,
} from "@/lib/study-guide/service";
import type { StudyGuide } from "@/lib/study-guide/types";

const EMPTY_GUIDE: StudyGuide = { sections: [], summary: "" };

export const POST = createRouteHandler({
	auth: "none",
	validate: (body: { subject?: string; topic?: string }) => {
		if (!body.subject || !body.topic) return "subject and topic are required";
		return null;
	},
	execute: async ({ body }: { body: { subject: string; topic: string } }) => {
		const { subject, topic } = body;

		const cached = await getCachedGuide(subject, topic);
		if (cached) return cached;

		if (!isAIConfigured()) {
			initAI({
				geminiApiKey: process.env.GEMINI_API_KEY,
				nvidiaApiKey: process.env.NVIDIA_API_KEY,
				groqApiKey: process.env.GROQ_API_KEY,
			});
			if (!isAIConfigured()) {
				return EMPTY_GUIDE;
			}
		}

		const guide = await generateGuide(subject, topic);

		if (guide.sections.length === 0) {
			return EMPTY_GUIDE;
		}

		await storeGuide(subject, topic, guide);

		return guide;
	},
	errorLabel: "StudyGuide",
});
