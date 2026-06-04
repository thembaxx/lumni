import { dexieDataAccess } from "@/lib/db";
import { safeJsonParse, safeJsonStringify } from "@/lib/shared/json";
import type { VisualContent } from "@/lib/visual-engine/types";
import type { CachedVisual } from "../schema";

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
	const existing = await dexieDataAccess.visuals
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
		await dexieDataAccess.visuals.update(existing.id ?? 0, record);
	} else {
		await dexieDataAccess.visuals.add(record as CachedVisual);
	}
}

export async function getCachedVisual(
	cacheKey: string,
): Promise<VisualContent | null> {
	const entry = await dexieDataAccess.visuals
		.where("cacheKey")
		.equals(cacheKey)
		.first();

	if (!entry) return null;

	if (Date.now() > entry.expiresAt) {
		await dexieDataAccess.visuals.delete(entry.id ?? 0);
		return null;
	}

	return safeJsonParse(entry.visual, null) as VisualContent | null;
}
