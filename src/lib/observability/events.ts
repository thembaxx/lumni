import { dexieDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";

export type EventType =
	| "page_view"
	| "feature_use"
	| "quiz_start"
	| "quiz_complete"
	| "flashcard_review"
	| "exam_start"
	| "exam_complete"
	| "study_plan_generate"
	| "tts_play"
	| "search"
	| "pwa_install"
	| "offline_visit";

export interface TrackEvent {
	type: EventType;
	label: string;
	metadata?: Record<string, string | number>;
	timestamp: string;
}

const STORAGE_KEY = "lumni_usage_events";
const MAX_EVENTS = 2000;

function loadEvents(): TrackEvent[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as TrackEvent[]) : [];
	} catch (err) {
		logError("LoadEvents", err);
		return [];
	}
}

function saveEvents(events: TrackEvent[]): void {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(events.slice(-MAX_EVENTS)),
		);
	} catch (err) {
		logError("SaveEvents", err);
	}
}

export function trackEvent(
	type: EventType,
	label: string,
	metadata?: Record<string, string | number>,
): void {
	const events = loadEvents();
	events.push({ type, label, metadata, timestamp: new Date().toISOString() });
	saveEvents(events);
}

/* ── Dexie-backed analytics events (1.4 WAM + retention) ── */

export async function trackSessionStart(
	userId: string,
	sessionId: string,
): Promise<void> {
	if (typeof window === "undefined" || !("indexedDB" in window)) return;
	try {
		await dexieDataAccess.analyticsEvents.add({
			eventType: "session_start",
			userId,
			sessionId,
			timestamp: Date.now(),
		});
	} catch (err) {
		logError("TrackSessionStart", err);
	}
}

export async function trackSessionEnd(
	userId: string,
	sessionId: string,
): Promise<void> {
	if (typeof window === "undefined" || !("indexedDB" in window)) return;
	try {
		await dexieDataAccess.analyticsEvents.add({
			eventType: "session_end",
			userId,
			sessionId,
			timestamp: Date.now(),
		});
	} catch (err) {
		logError("TrackSessionEnd", err);
	}
}

export async function trackDayActive(userId: string): Promise<void> {
	if (typeof window === "undefined" || !("indexedDB" in window)) return;
	try {
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);
		const existing = await dexieDataAccess.analyticsEvents
			.where("eventType")
			.equals("day_active")
			.filter((e) => e.userId === userId && e.timestamp >= todayStart.getTime())
			.first();
		if (existing) return;
		await dexieDataAccess.analyticsEvents.add({
			eventType: "day_active",
			userId,
			timestamp: Date.now(),
		});
	} catch (err) {
		logError("TrackDayActive", err);
	}
}

export interface CohortStats {
	dau: number;
	wau: number;
	totalActiveUsers: number;
	dailyCounts: { date: string; count: number }[];
}

export async function getCohortStats(days = 30): Promise<CohortStats> {
	if (typeof window === "undefined" || !("indexedDB" in window)) {
		return { dau: 0, wau: 0, totalActiveUsers: 0, dailyCounts: [] };
	}
	try {
		const now = Date.now();
		const dayMs = 86400000;
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);
		const weekAgo = now - 7 * dayMs;
		const monthAgo = now - days * dayMs;

		const events = await dexieDataAccess.analyticsEvents
			.where("eventType")
			.anyOf(["day_active", "session_start"])
			.filter((e) => e.timestamp >= monthAgo)
			.toArray();

		const dau = new Set(
			events
				.filter((e) => e.timestamp >= todayStart.getTime())
				.map((e) => e.userId),
		).size;
		const wau = new Set(
			events.filter((e) => e.timestamp >= weekAgo).map((e) => e.userId),
		).size;
		const totalActiveUsers = new Set(events.map((e) => e.userId)).size;

		const dailyMap = new Map<string, Set<string>>();
		for (let i = 0; i < days; i++) {
			const d = new Date(now - i * dayMs);
			dailyMap.set(d.toISOString().slice(0, 10), new Set());
		}
		for (const e of events) {
			const key = new Date(e.timestamp).toISOString().slice(0, 10);
			const set = dailyMap.get(key);
			if (set) set.add(e.userId);
		}
		const dailyCounts = Array.from(dailyMap.entries())
			.map(([date, users]) => ({ date, count: users.size }))
			.sort((a, b) => a.date.localeCompare(b.date));

		return { dau, wau, totalActiveUsers, dailyCounts };
	} catch (err) {
		logError("GetCohortStats", err);
		return { dau: 0, wau: 0, totalActiveUsers: 0, dailyCounts: [] };
	}
}

export function getEventSummary() {
	const events = loadEvents();
	if (events.length === 0) {
		return { totalEvents: 0, byType: {}, recentEvents: [] };
	}

	const byType: Record<string, number> = {};
	for (const e of events) {
		byType[e.type] = (byType[e.type] || 0) + 1;
	}

	const lastDay = events.filter(
		(e) => Date.now() - new Date(e.timestamp).getTime() < 86400000,
	);

	return {
		totalEvents: events.length,
		last24h: lastDay.length,
		byType,
		recentEvents: events.slice(-20).reverse(),
	};
}

export function clearEvents(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (err) {
		logError("ClearEvents", err);
	}
}
