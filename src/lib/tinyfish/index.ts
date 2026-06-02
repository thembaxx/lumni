import { getDataSharingConsent } from "@/lib/consent/ai-gate";
import {
	DEFAULT_FETCH_MAX_CHARS,
	DEFAULT_SEARCH_RESULTS,
	GENERATE_CACHE_TTL_MS,
	isDomainBlocked,
	isSubjectAllowed,
	PER_USER_DAILY_LIMIT,
	SOLVE_CACHE_TTL_MS,
} from "./allowlist";
import {
	buildGenerateKey,
	buildSolveKey,
	emptyRagContext,
	getCached,
	getTodayUsageCount,
	incrementTodayUsage,
	setCached,
} from "./cache";
import {
	isTinyFishConfigured,
	TinyFishError,
	tinyfishFetch,
	tinyfishSearch,
} from "./client";
import { deduped } from "./in-flight";
import type { RagContext, WebSource } from "./types";
import { buildRagContext, extractSourceFromFetchResult } from "./wrap";

export {
	ALLOWED_SUBJECTS,
	BLOCKED_DOMAINS,
	DEFAULT_FETCH_MAX_CHARS,
	DEFAULT_SEARCH_RESULTS,
	GENERATE_CACHE_TTL_MS,
	isDomainBlocked,
	isSubjectAllowed,
	MAX_SOURCE_CONTENT_CHARS,
	MIN_CONTENT_LENGTH,
	PER_USER_DAILY_LIMIT,
	REQUEST_TIMEOUT_MS,
	SOLVE_CACHE_TTL_MS,
} from "./allowlist";
export type { TinyFishCacheEntry, TinyFishUsageEntry } from "./cache";
export {
	buildGenerateKey,
	buildSolveKey,
	clearExpiredCache,
	deleteCached,
	emptyRagContext,
	getCached,
	getTodayUsageCount,
	incrementTodayUsage,
	isRagContextEmpty,
	setCached,
	urlsFromCache,
} from "./cache";
export {
	isTinyFishConfigured,
	TinyFishError,
	tinyfishFetch,
	tinyfishSearch,
} from "./client";
export { clearInFlight, deduped, hasInFlight, inFlightSize } from "./in-flight";
export * from "./types";
export {
	buildPromptInstruction,
	buildRagContext,
	extractSourceFromFetchResult,
	isSourceViable,
	truncateContent,
} from "./wrap";

export interface RagOptions {
	subject: string;
	topic: string;
	userId?: string;
}

export interface SourceOptions {
	question: string;
	userId?: string;
}

export async function searchWithRAG({
	subject,
	topic,
	userId,
}: RagOptions): Promise<RagContext> {
	if (!isSubjectAllowed(subject)) {
		return emptyRagContext();
	}
	if (!getDataSharingConsent()) {
		return emptyRagContext();
	}
	if (!isTinyFishConfigured()) {
		return emptyRagContext();
	}
	if (!topic.trim()) {
		return emptyRagContext();
	}
	if (userId) {
		const used = await getTodayUsageCount(userId);
		if (used >= PER_USER_DAILY_LIMIT) {
			return emptyRagContext();
		}
	}

	const key = buildGenerateKey(subject, topic);
	const cached = await getCached(key);
	if (cached) return cached;

	return deduped(key, async () => {
		const fetched = await fetchRagForTopic(subject, topic);
		if (fetched.sources.length > 0) {
			await setCached(key, fetched, GENERATE_CACHE_TTL_MS);
		}
		if (userId) {
			await incrementTodayUsage(userId);
		}
		return fetched;
	});
}

export async function getSourceForQuestion({
	question,
	userId,
}: SourceOptions): Promise<RagContext> {
	if (!getDataSharingConsent()) {
		return emptyRagContext();
	}
	if (!isTinyFishConfigured()) {
		return emptyRagContext();
	}
	if (question.trim().split(/\s+/).length < 5) {
		return emptyRagContext();
	}
	if (userId) {
		const used = await getTodayUsageCount(userId);
		if (used >= PER_USER_DAILY_LIMIT) {
			return emptyRagContext();
		}
	}

	const key = buildSolveKey(question);
	const cached = await getCached(key);
	if (cached) return cached;

	return deduped(key, async () => {
		const fetched = await fetchSourceForQuestion(question);
		if (fetched.sources.length > 0) {
			await setCached(key, fetched, SOLVE_CACHE_TTL_MS);
		}
		if (userId) {
			await incrementTodayUsage(userId);
		}
		return fetched;
	});
}

async function fetchRagForTopic(
	subject: string,
	topic: string,
): Promise<RagContext> {
	try {
		const search = await tinyfishSearch(`${subject} ${topic} CAPS curriculum`, {
			location: "ZA",
			language: "en",
			numResults: DEFAULT_SEARCH_RESULTS,
		});

		const allowed = search.results
			.filter((r) => !isDomainBlocked(r.url))
			.slice(0, DEFAULT_SEARCH_RESULTS);

		if (allowed.length === 0) return emptyRagContext();

		const urls = allowed.map((r) => r.url);
		const fetched = await tinyfishFetch(urls, {
			format: "markdown",
			maxCharacters: DEFAULT_FETCH_MAX_CHARS,
		});

		const sources: WebSource[] = fetched.results.map(
			extractSourceFromFetchResult,
		);
		return buildRagContext(sources);
	} catch (err) {
		if (err instanceof TinyFishError) {
			console.warn(`[tinyfish] RAG fetch failed: ${err.message}`);
		}
		return emptyRagContext();
	}
}

async function fetchSourceForQuestion(question: string): Promise<RagContext> {
	try {
		const search = await tinyfishSearch(`${question} site:education.gov.za`, {
			location: "ZA",
			language: "en",
			numResults: 1,
		});

		const first = search.results.find((r) => !isDomainBlocked(r.url));
		if (!first) return emptyRagContext();

		const fetched = await tinyfishFetch([first.url], {
			format: "markdown",
			maxCharacters: DEFAULT_FETCH_MAX_CHARS,
		});

		const firstResult = fetched.results[0];
		if (!firstResult) return emptyRagContext();

		const source = extractSourceFromFetchResult(firstResult);
		return buildRagContext([source]);
	} catch (err) {
		if (err instanceof TinyFishError) {
			console.warn(`[tinyfish] source fetch failed: ${err.message}`);
		}
		return emptyRagContext();
	}
}
