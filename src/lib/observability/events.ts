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
	| "search";

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
	} catch {
		return [];
	}
}

function saveEvents(events: TrackEvent[]): void {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(events.slice(-MAX_EVENTS)),
		);
	} catch {
		/* silent */
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
	} catch {
		/* noop */
	}
}
