import type { VisualContent } from "@/lib/visual-engine/types";
import { safeJsonParse, safeJsonStringify } from "@/lib/utils/json";
import { offlineDB, type CachedVisual } from "../schema";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function makeCacheKey(questionId: string, subject: string): string {
	return `${questionId}-${subject}`
		.replace(/[^a-zA-Z0-9._-]/g, "_")
		.slice(0, 36);
}

export async function cacheVisual(
	cacheKey: string,
	subject: string,
	visual: VisualContent | null,
): Promise<void> {
	const now = Date.now();
	const existing = await offlineDB.visuals
		.where("cacheKey")
		.equals(cacheKey)
		.first();

	const record: Omit<CachedVisual, "id"> = {
		cacheKey,
		subject,
		visual: safeJsonStringify(visual),
		createdAt: now,
		expiresAt: now + CACHE_TTL_MS,
	};

	if (existing) {
		await offlineDB.visuals.update(existing.id!, record);
	} else {
		await offlineDB.visuals.add(record as CachedVisual);
	}
}

export async function getCachedVisual(
	cacheKey: string,
): Promise<VisualContent | null> {
	const entry = await offlineDB.visuals
		.where("cacheKey")
		.equals(cacheKey)
		.first();

	if (!entry) return null;

	if (Date.now() > entry.expiresAt) {
		await offlineDB.visuals.delete(entry.id!);
		return null;
	}

	return safeJsonParse(entry.visual, null) as VisualContent | null;
}
