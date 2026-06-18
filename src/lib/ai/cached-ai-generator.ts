import type { AIClient } from "@/lib/ai/client";
import type { DataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";

export interface CachedAIGeneratorConfig<T> {
	systemPrompt: string;
	ttlMs: number;
	buildPrompt: (subject: string, topic: string) => string;
	parseResponse: (content: string) => T;
	emptyResult: T;
	isEmpty: (result: T) => boolean;
	getTable: (db: DataAccess) => {
		get: (key: string) => Promise<{ expiresAt: number } | undefined>;
		put: (entry: unknown) => Promise<unknown>;
	};
	buildCacheEntry: (
		key: string,
		data: T,
		ttlMs: number,
		subject: string,
		topic: string,
	) => unknown;
	extractData: (cached: unknown) => T;
	buildCacheKey: (subject: string, topic: string) => string;
	errorLabel: string;
}

export class CachedAIGenerator<T> {
	constructor(
		private readonly config: CachedAIGeneratorConfig<T>,
		private readonly ai: AIClient,
		private readonly db: DataAccess,
	) {}

	async generate(subject: string, topic: string): Promise<T> {
		const prompt = this.config.buildPrompt(subject, topic);
		const result = await this.ai.generateWithSystem(
			this.config.systemPrompt,
			prompt,
		);
		if (!("content" in result) || !result.content) {
			return this.config.emptyResult;
		}
		try {
			const parsed = this.config.parseResponse(result.content);
			return parsed;
		} catch (err) {
			logError(this.config.errorLabel, err);
			return this.config.emptyResult;
		}
	}

	async getCached(subject: string, topic: string): Promise<T | null> {
		try {
			const key = this.config.buildCacheKey(subject, topic);
			const table = this.config.getTable(this.db);
			const cached = await table.get(key);
			if (cached && cached.expiresAt > Date.now()) {
				return this.config.extractData(cached);
			}
		} catch {
			// IndexedDB unavailable (server-side)
		}
		return null;
	}

	async store(subject: string, topic: string, data: T): Promise<void> {
		try {
			const key = this.config.buildCacheKey(subject, topic);
			const table = this.config.getTable(this.db);
			const entry = this.config.buildCacheEntry(
				key,
				data,
				this.config.ttlMs,
				subject,
				topic,
			);
			await table.put(entry);
		} catch {
			// IndexedDB unavailable (server-side)
		}
	}

	async fetchWithCache(subject: string, topic: string): Promise<T> {
		const cached = await this.getCached(subject, topic);
		if (cached) return cached;

		const result = await this.generate(subject, topic);
		if (!this.config.isEmpty(result)) {
			await this.store(subject, topic, result);
		}
		return result;
	}
}
