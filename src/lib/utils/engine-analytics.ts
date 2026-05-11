import { safeJsonParse, safeJsonStringify } from "./json";

export interface AnalyticsEvent {
	event: "generate" | "grade" | "hint" | "validate";
	timestamp: number;
	subject?: string;
	questionType?: string;
	count?: number;
	duration?: number;
	success: boolean;
}

const ANALYTICS_KEY = "lumni_engine_analytics";

export function trackEngineEvent(data: Omit<AnalyticsEvent, "timestamp">): void {
	try {
		const events = loadEvents();
		events.push({ ...data, timestamp: Date.now() });
		const recent = events.slice(-500);
		localStorage.setItem(ANALYTICS_KEY, safeJsonStringify(recent));
	} catch {
		// silently fail
	}
}

export function loadEvents(): AnalyticsEvent[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(ANALYTICS_KEY);
		return raw ? (safeJsonParse(raw, []) as AnalyticsEvent[]) : [];
	} catch {
		return [];
	}
}

export function getAnalyticsSummary(): {
	totalRequests: number;
	generateCount: number;
	gradeCount: number;
	hintCount: number;
	successRate: number;
	bySubject: Record<string, number>;
	byType: Record<string, number>;
} {
	const events = loadEvents();
	if (events.length === 0) {
		return {
			totalRequests: 0, generateCount: 0, gradeCount: 0, hintCount: 0,
			successRate: 0, bySubject: {}, byType: {},
		};
	}

	const bySubject: Record<string, number> = {};
	const byType: Record<string, number> = {};
	let generate = 0, grade = 0, hint = 0, success = 0;

	for (const e of events) {
		if (e.event === "generate") generate++;
		if (e.event === "grade") grade++;
		if (e.event === "hint") hint++;
		if (e.success) success++;
		if (e.subject) bySubject[e.subject] = (bySubject[e.subject] || 0) + 1;
		if (e.questionType) byType[e.questionType] = (byType[e.questionType] || 0) + 1;
	}

	return {
		totalRequests: events.length,
		generateCount: generate,
		gradeCount: grade,
		hintCount: hint,
		successRate: Math.round((success / events.length) * 100),
		bySubject,
		byType,
	};
}

export function clearAnalytics(): void {
	try {
		localStorage.removeItem(ANALYTICS_KEY);
	} catch {
		// ignore
	}
}
