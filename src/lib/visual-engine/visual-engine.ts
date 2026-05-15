import { initAI, isAIConfigured } from "@/lib/ai";
import type { CacheTier } from "@/lib/caching-strategy";
import { CachingStrategy } from "@/lib/caching-strategy";
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
	private cachingStrategy: CachingStrategy<VisualContent, VisualEngineParams>;

	constructor() {
		this.cachingStrategy = new CachingStrategy<
			VisualContent,
			VisualEngineParams
		>(
			[
				{
					name: "dexie",
					read: async (params) => {
						const cacheKey = makeCacheKey(params.questionId, params.subject);
						return getCachedVisual(cacheKey);
					},
					write: async (params, visual) => {
						const cacheKey = makeCacheKey(params.questionId, params.subject);
						await cacheVisual(cacheKey, params.subject, visual);
					},
				},
				{
					name: "appwrite",
					read: async (params) => {
						try {
							return loadVisualFromAppwrite(params.questionId, params.subject);
						} catch {
							return null;
						}
					},
					write: async (params, visual) => {
						await saveVisualToAppwrite(
							params.questionId,
							params.subject,
							visual,
						);
					},
				},
			],
			{
				generate: async (params) => this.generate(params),
			},
		);
	}

	static initialize(): void {
		if (!isAIConfigured()) {
			initAI({
				geminiApiKey: process.env.GEMINI_API_KEY,
				groqApiKey: process.env.GROQ_API_KEY,
			});
		}
	}

	async resolve(params: VisualEngineParams): Promise<VisualContent | null> {
		return this.cachingStrategy.resolve(params);
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
}

export const visualEngine = new VisualEngine();
