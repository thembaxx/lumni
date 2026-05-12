import Dexie from "dexie";
import { initAI, isAIConfigured } from "@/lib/ai";
import { searchImage } from "./image-resolver";
import { generateDiagram } from "./stem-renderer";
import type {
	VisualCacheEntry,
	VisualContent,
	VisualEngineParams,
} from "./types";
import { STEM_SUBJECTS } from "./types";
import {
	loadVisualFromAppwrite,
	saveVisualToAppwrite,
} from "./visual-persistence";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

let db: Dexie | null = null;

function getStore(): Dexie {
	if (!db) {
		db = new Dexie("lumni");
		db.version(1).stores({
			visuals: "id, subject, createdAt",
		});
	}
	return db;
}

function makeCacheKey(questionId: string, subject: string): string {
	return `${questionId}-${subject}`
		.replace(/[^a-zA-Z0-9._-]/g, "_")
		.slice(0, 36);
}

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

		const cached = await this.checkCache(cacheKey);
		if (cached) return cached;

		const appwriteVisual = await this.checkAppwriteCache(
			params.questionId,
			params.subject,
		);
		if (appwriteVisual) {
			await this.writeDexieCache(cacheKey, params.subject, appwriteVisual);
			return appwriteVisual;
		}

		const visual = await this.generate(params);

		await Promise.allSettled([
			this.writeDexieCache(cacheKey, params.subject, visual),
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

	private async checkCache(cacheKey: string): Promise<VisualContent | null> {
		try {
			const store = getStore();
			const entry = await store.table("visuals").get(cacheKey);

			if (!entry) return null;

			if (Date.now() > new Date(entry.expiresAt).getTime()) {
				await store.table("visuals").delete(cacheKey);
				return null;
			}

			return entry.visual;
		} catch {
			return null;
		}
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

	private async writeDexieCache(
		cacheKey: string,
		subject: string,
		visual: VisualContent | null,
	): Promise<void> {
		try {
			const store = getStore();
			const now = new Date();
			const entry: VisualCacheEntry = {
				id: cacheKey,
				subject,
				visual,
				createdAt: now.toISOString(),
				expiresAt: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
			};
			await store.table("visuals").put(entry);
		} catch {
			/* cache write failure is non-critical */
		}
	}
}

export const visualEngine = new VisualEngine();
