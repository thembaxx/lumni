export interface AILatencyRecord {
	provider: string;
	durationMs: number;
	success: boolean;
	callType: "generate" | "grade" | "hint" | "visual" | "embed";
	subject?: string;
	timestamp: string;
}

const MAX_RECORDS = 1000;
const STORAGE_KEY = "lumni_ai_latency";

function loadRecords(): AILatencyRecord[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as AILatencyRecord[]) : [];
	} catch {
		return [];
	}
}

function saveRecords(records: AILatencyRecord[]): void {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(records.slice(-MAX_RECORDS)),
		);
	} catch {
		/* storage full — silently drop */
	}
}

export function trackAILatency(record: AILatencyRecord): void {
	const records = loadRecords();
	records.push(record);
	saveRecords(records);
}

export function getAILatencyStats() {
	const records = loadRecords();
	if (records.length === 0) {
		return {
			totalCalls: 0,
			byProvider: {},
			averageLatencyMs: 0,
			successRate: 100,
		};
	}

	const byProvider: Record<
		string,
		{ calls: number; successes: number; totalDurationMs: number }
	> = {};

	for (const r of records) {
		if (!byProvider[r.provider]) {
			byProvider[r.provider] = { calls: 0, successes: 0, totalDurationMs: 0 };
		}
		byProvider[r.provider].calls++;
		if (r.success) byProvider[r.provider].successes++;
		byProvider[r.provider].totalDurationMs += r.durationMs;
	}

	const totalCalls = records.length;
	const totalSuccesses = records.filter((r) => r.success).length;
	const totalDuration = records.reduce((s, r) => s + r.durationMs, 0);

	return {
		totalCalls,
		successRate:
			totalCalls > 0 ? Math.round((totalSuccesses / totalCalls) * 100) : 100,
		averageLatencyMs:
			totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
		recentCalls: records.slice(-50).reverse(),
		byProvider: Object.fromEntries(
			Object.entries(byProvider).map(([name, stats]) => [
				name,
				{
					...stats,
					averageLatencyMs:
						stats.calls > 0
							? Math.round(stats.totalDurationMs / stats.calls)
							: 0,
					successRate: Math.round((stats.successes / stats.calls) * 100),
				},
			]),
		),
	};
}

export function clearAILatencyRecords(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		/* noop */
	}
}
