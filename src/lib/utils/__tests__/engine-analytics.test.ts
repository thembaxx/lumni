import { beforeAll, beforeEach, describe, expect, test } from "bun:test";

const mockStore = new Map<string, string>();

beforeAll(async () => {
	Object.defineProperty(globalThis, "window", {
		value: {},
		writable: true,
		configurable: true,
	});
	Object.defineProperty(globalThis, "localStorage", {
		value: {
			getItem: (key: string) => mockStore.get(key) ?? null,
			setItem: (key: string, value: string) => {
				mockStore.set(key, value);
			},
			removeItem: (key: string) => {
				mockStore.delete(key);
			},
			clear: () => mockStore.clear(),
			get length() {
				return mockStore.size;
			},
			key: (i: number) => [...mockStore.keys()][i] ?? null,
		},
		writable: true,
		configurable: true,
	});
});

const { trackEngineEvent, loadEvents, getAnalyticsSummary, clearAnalytics } =
	await import("../engine-analytics");

beforeEach(() => {
	mockStore.clear();
});

describe("trackEngineEvent", () => {
	test("stores an analytics event", () => {
		trackEngineEvent({
			event: "generate",
			subject: "math",
			questionType: "multiple-choice",
			count: 5,
			success: true,
		});
		const events = loadEvents();
		expect(events).toHaveLength(1);
		expect(events[0].event).toBe("generate");
		expect(events[0].subject).toBe("math");
	});

	test("timestamps the event", () => {
		const before = Date.now();
		trackEngineEvent({
			event: "grade",
			success: true,
		});
		const events = loadEvents();
		expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
		expect(events[0].timestamp).toBeLessThanOrEqual(Date.now());
	});
});

describe("loadEvents", () => {
	test("returns empty array when no events", () => {
		expect(loadEvents()).toEqual([]);
	});

	test("returns previously stored events", () => {
		trackEngineEvent({ event: "hint", success: true });
		const events = loadEvents();
		expect(events).toHaveLength(1);
		expect(events[0].event).toBe("hint");
	});
});

describe("getAnalyticsSummary", () => {
	test("returns empty summary when no events", () => {
		const summary = getAnalyticsSummary();
		expect(summary).toEqual({
			totalRequests: 0,
			generateCount: 0,
			gradeCount: 0,
			hintCount: 0,
			successRate: 0,
			bySubject: {},
			byType: {},
		});
	});

	test("counts generate events", () => {
		trackEngineEvent({ event: "generate", success: true });
		trackEngineEvent({ event: "generate", success: true });
		const summary = getAnalyticsSummary();
		expect(summary.totalRequests).toBe(2);
		expect(summary.generateCount).toBe(2);
		expect(summary.gradeCount).toBe(0);
		expect(summary.hintCount).toBe(0);
	});

	test("counts grade and hint events", () => {
		trackEngineEvent({ event: "grade", success: true });
		trackEngineEvent({ event: "hint", success: true });
		trackEngineEvent({ event: "hint", success: true });
		const summary = getAnalyticsSummary();
		expect(summary.totalRequests).toBe(3);
		expect(summary.generateCount).toBe(0);
		expect(summary.gradeCount).toBe(1);
		expect(summary.hintCount).toBe(2);
	});

	test("calculates success rate", () => {
		trackEngineEvent({ event: "generate", success: true });
		trackEngineEvent({ event: "generate", success: true });
		trackEngineEvent({ event: "generate", success: false });
		const summary = getAnalyticsSummary();
		expect(summary.successRate).toBe(67);
	});

	test("groups by subject", () => {
		trackEngineEvent({ event: "generate", subject: "math", success: true });
		trackEngineEvent({ event: "grade", subject: "physics", success: true });
		trackEngineEvent({ event: "generate", subject: "math", success: true });
		const summary = getAnalyticsSummary();
		expect(summary.bySubject).toEqual({ math: 2, physics: 1 });
	});

	test("groups by question type", () => {
		trackEngineEvent({
			event: "generate",
			questionType: "multiple-choice",
			success: true,
		});
		trackEngineEvent({
			event: "grade",
			questionType: "calculation",
			success: true,
		});
		const summary = getAnalyticsSummary();
		expect(summary.byType).toEqual({
			"multiple-choice": 1,
			calculation: 1,
		});
	});
});

describe("clearAnalytics", () => {
	test("clears all events", () => {
		trackEngineEvent({ event: "generate", success: true });
		clearAnalytics();
		expect(loadEvents()).toEqual([]);
	});
});
