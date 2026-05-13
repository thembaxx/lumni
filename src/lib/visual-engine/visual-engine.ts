import { initAI, isAIConfigured } from "@/lib/ai";
import { cacheVisual, getCachedVisual, makeCacheKey } from "@/lib/db/offline";
import { searchImage } from "./image-resolver";
import { generateDiagram } from "./stem-renderer";
import type { VisualContent, VisualEngineParams } from "./types";
import { STEM_SUBJECTS } from "./types";
import {
	loadVisualFromAppwrite,
	saveVisualToAppwrite,
} from "./visual-persistence";

export class VisualEngine {
	static initialize(): void {
		if (!isAIConfigured()) {
			initAI({
				geminiApiKey: process.env.GEMINI_API_KEY,
				groqApiKey: process.env.GROQ_API_KEY,
				deepseekApiKey: process.env.DEEPSEEK_API_KEY,
			});
		}
	}

	async resolve(params: VisualEngineParams): Promise<VisualContent | null> {
		const cacheKey = makeCacheKey(params.questionId, params.subject);

		const cached = await getCachedVisual(cacheKey);
		if (cached) return cached;

		const appwriteVisual = await this.checkAppwriteCache(
			params.questionId,
			params.subject,
		);
		if (appwriteVisual) {
			await cacheVisual(cacheKey, params.subject, appwriteVisual);
			return appwriteVisual;
		}

		const visual = await this.generate(params);

		await Promise.allSettled([
			cacheVisual(cacheKey, params.subject, visual),
			saveVisualToAppwrite(params.questionId, params.subject, visual),
		]);

		return visual;
	}

	private async generate(
		params: VisualEngineParams,
	): Promise<VisualContent | null> {
		const isSTEM = STEM_SUBJECTS.has(params.subject);

		if (isSTEM) {
			const diagram = await generateDiagram(
				params.questionText,
				params.subject,
				params.topic,
			);
			if (diagram) return diagram;
			const fallback = await searchImage(
				params.questionText,
				params.subject,
				params.topic,
			);
			if (!fallback) return null;
			return {
				type: "image",
				label: fallback.title,
				imageUrl: fallback.url,
				attribution: fallback.attribution,
				sourceUrl: fallback.pageUrl,
			};
		}

		const image = await searchImage(
			params.questionText,
			params.subject,
			params.topic,
		);
		if (image) {
			return {
				type: "image",
				label: image.title,
				imageUrl: image.url,
				attribution: image.attribution,
				sourceUrl: image.pageUrl,
			};
		}

		return generateDiagram(params.questionText, params.subject, params.topic);
	}

	private async checkAppwriteCache(
		questionId: string,
		subject: string,
	): Promise<VisualContent | null> {
		try {
			return loadVisualFromAppwrite(questionId, subject);
		} catch {
			return null;
		}
	}
}

export const visualEngine = new VisualEngine();
