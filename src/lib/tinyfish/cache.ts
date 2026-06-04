import { dexieDataAccess } from "@/lib/db";
import type { RagContext, WebSource } from "./types";

export interface TinyFishCacheEntry {
	key: string;
	value: RagContext;
	expiresAt: number;
	fetchedAt: number;
}

export interface TinyFishUsageEntry {
	id?: number;
	userId: string;
	date: string;
	count: number;
}

function todayDateKey(): string {
	return new Date().toISOString().slice(0, 10);
}

export async function getCached(key: string): Promise<RagContext | null> {
	const entry = await dexieDataAccess.tinyfishCache.get(key);
	if (!entry) return null;
	if (entry.expiresAt < Date.now()) {
		await dexieDataAccess.tinyfishCache.delete(key);
		return null;
	}
	return entry.value;
}

export async function setCached(
	key: string,
	value: RagContext,
	ttlMs: number,
): Promise<void> {
	const now = Date.now();
	const entry: TinyFishCacheEntry = {
		key,
		value,
		expiresAt: now + ttlMs,
		fetchedAt: now,
	};
	await dexieDataAccess.tinyfishCache.put(entry);
}

export async function deleteCached(key: string): Promise<void> {
	await dexieDataAccess.tinyfishCache.delete(key);
}

export async function clearExpiredCache(): Promise<number> {
	const now = Date.now();
	const expired = (
		await dexieDataAccess.tinyfishCache.where("expiresAt").below(now).toArray()
	).map((e) => e.key);
	if (expired.length > 0) {
		await dexieDataAccess.tinyfishCache.bulkDelete(expired);
	}
	return expired.length;
}

export async function getTodayUsageCount(userId: string): Promise<number> {
	const date = todayDateKey();
	const entry = await dexieDataAccess.tinyfishUsage
		.where("[userId+date]")
		.equals([userId, date])
		.first();
	return entry?.count ?? 0;
}

export async function incrementTodayUsage(userId: string): Promise<number> {
	const date = todayDateKey();
	const existing = await dexieDataAccess.tinyfishUsage
		.where("[userId+date]")
		.equals([userId, date])
		.first();

	if (existing) {
		const next = existing.count + 1;
		await dexieDataAccess.tinyfishUsage.update(existing.id ?? 0, {
			count: next,
		});
		return next;
	}

	await dexieDataAccess.tinyfishUsage.add({ userId, date, count: 1 });
	return 1;
}

export function buildGenerateKey(subject: string, topic: string): string {
	const subjectKey = subject.trim().toLowerCase();
	const slug = topic
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return `gen:${subjectKey}:${slug}`;
}

export function buildSolveKey(question: string): string {
	const hash = simpleHash(question.trim().toLowerCase());
	return `solve:${hash}`;
}

function simpleHash(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		const char = input.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash |= 0;
	}
	return (hash >>> 0).toString(36);
}

export function emptyRagContext(): RagContext {
	return { sources: [], xml: "", domainsQueried: [] };
}

export function isRagContextEmpty(ctx: RagContext): boolean {
	return ctx.sources.length === 0;
}

export function urlsFromCache(ctx: RagContext): string[] {
	return ctx.sources.map((s: WebSource) => s.url);
}
