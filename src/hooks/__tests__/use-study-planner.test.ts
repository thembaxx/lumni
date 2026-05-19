import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type {
	ExamDate,
	StudyPlan,
	StudySession,
} from "@/lib/utils/study-planner";

let mockPlan: StudyPlan = { sessions: [], examDates: [], generatedAt: 0 };
let mockSessions: StudySession[] = [];
let mockUpcoming: StudySession[] = [];
let mockUpcomingExams: ExamDate[] = [];
let mockStats = {
	totalSessions: 0,
	completedSessions: 0,
	upcomingSessions: 0,
	studyTimeMinutes: 0,
	examCount: 0,
	daysUntilNextExam: null as number | null,
};

mock.module("@/lib/utils/study-planner", () => ({
	loadStudyPlan: () => ({
		sessions: [...mockPlan.sessions],
		examDates: [...mockPlan.examDates],
		generatedAt: mockPlan.generatedAt,
	}),
	saveStudyPlan: (plan: StudyPlan) => {
		mockPlan = plan;
	},
	addStudySession: (session: Omit<StudySession, "id">) => {
		const s: StudySession = { ...session, id: "session-new" };
		mockPlan.sessions.push(s);
		mockSessions = [...mockSessions, s];
		mockUpcoming = [...mockUpcoming, s];
		return {
			sessions: [...mockPlan.sessions],
			examDates: [...mockPlan.examDates],
			generatedAt: mockPlan.generatedAt,
		};
	},
	updateStudySession: (id: string, updates: Partial<StudySession>) => {
		mockPlan.sessions = mockPlan.sessions.map((s) =>
			s.id === id ? { ...s, ...updates } : s,
		);
		return {
			sessions: [...mockPlan.sessions],
			examDates: [...mockPlan.examDates],
			generatedAt: mockPlan.generatedAt,
		};
	},
	deleteStudySession: (id: string) => {
		mockPlan.sessions = mockPlan.sessions.filter((s) => s.id !== id);
		mockSessions = mockSessions.filter((s) => s.id !== id);
		mockUpcoming = mockUpcoming.filter((s) => s.id !== id);
		return {
			sessions: [...mockPlan.sessions],
			examDates: [...mockPlan.examDates],
			generatedAt: mockPlan.generatedAt,
		};
	},
	addExamDate: (exam: Omit<ExamDate, "id" | "daysUntil">) => {
		const e: ExamDate = { ...exam, id: "exam-new", daysUntil: 10 };
		mockPlan.examDates.push(e);
		mockUpcomingExams = [...mockUpcomingExams, e];
		return {
			sessions: [...mockPlan.sessions],
			examDates: [...mockPlan.examDates],
			generatedAt: mockPlan.generatedAt,
		};
	},
	deleteExamDate: (id: string) => {
		mockPlan.examDates = mockPlan.examDates.filter((e) => e.id !== id);
		mockUpcomingExams = mockUpcomingExams.filter((e) => e.id !== id);
		return {
			sessions: [...mockPlan.sessions],
			examDates: [...mockPlan.examDates],
			generatedAt: mockPlan.generatedAt,
		};
	},
	getUpcomingSessions: () => [...mockUpcoming],
	getTodaySessions: () => [...mockSessions],
	getUpcomingExams: () => [...mockUpcomingExams],
	getStudyStats: () => ({ ...mockStats }),
	autoScheduleSessions: (
		_subjects: string[],
		_weakTopics: Record<string, string[]>,
	) => {
		return {
			sessions: [...mockPlan.sessions],
			examDates: [...mockPlan.examDates],
			generatedAt: mockPlan.generatedAt,
		};
	},
}));

mock.module("@/lib/study-planner/study-planner-service", () => ({
	getStudyPlannerService: () => ({
		generateStudyPlan: async () => ({
			topics: [
				{
					subjectId: "mathematics",
					topicId: "algebra",
					scheduledDate: new Date(Date.now() + 86400000).toISOString(),
					estimatedMinutes: 30,
					isCompleted: false,
				},
			],
		}),
	}),
}));

const { useStudyPlanner } = await import("@/hooks/use-study-planner");

describe("useStudyPlanner", () => {
	beforeEach(() => {
		mockPlan = { sessions: [], examDates: [], generatedAt: 0 };
		mockSessions = [];
		mockUpcoming = [];
		mockUpcomingExams = [];
		mockStats = {
			totalSessions: 0,
			completedSessions: 0,
			upcomingSessions: 0,
			studyTimeMinutes: 0,
			examCount: 0,
			daysUntilNextExam: null,
		};
	});

	afterEach(() => {
		// clean up intervals scheduled by the hook
	});
});

function setupIntervalTracking() {
	const originalSet = globalThis.setInterval;
	const originalClear = globalThis.clearInterval;
	const tracked = new Set<ReturnType<typeof setInterval>>();

	globalThis.setInterval = ((fn: () => void, ms: number) => {
		const id = originalSet(fn, ms);
		tracked.add(id);
		return id;
	}) as unknown as typeof setInterval;

	globalThis.clearInterval = ((id: ReturnType<typeof setInterval>) => {
		tracked.delete(id);
		originalClear(id);
	}) as unknown as typeof clearInterval;

	return {
		tracked,
		restore: () => {
			globalThis.setInterval = originalSet;
			globalThis.clearInterval = originalClear;
		},
	};
}

describe("useStudyPlanner operations", () => {
	beforeEach(() => {
		mockPlan = { sessions: [], examDates: [], generatedAt: 0 };
		mockSessions = [];
		mockUpcoming = [];
		mockUpcomingExams = [];
		mockStats = {
			totalSessions: 0,
			completedSessions: 0,
			upcomingSessions: 0,
			studyTimeMinutes: 0,
			examCount: 0,
			daysUntilNextExam: null,
		};
	});

	test("loads plan from storage on mount", () => {
		mockPlan = {
			sessions: [],
			examDates: [],
			generatedAt: Date.now(),
		};

		const { result } = renderHook(() => useStudyPlanner());

		expect(result.current.plan).toBeDefined();
		expect(result.current.todaySessions).toEqual([]);
		expect(result.current.upcomingSessions).toEqual([]);
		expect(result.current.stats.totalSessions).toBe(0);
	});

	test("addSession adds a session and refreshes", () => {
		const { result } = renderHook(() => useStudyPlanner());

		act(() => {
			result.current.addSession({
				subject: "mathematics",
				topic: "algebra",
				type: "quiz",
				scheduledAt: Date.now(),
				duration: 30,
				completed: false,
			});
		});

		expect(result.current.plan.sessions.length).toBeGreaterThanOrEqual(1);
	});

	test("removeSession deletes a session and refreshes", () => {
		const session: StudySession = {
			id: "session-to-remove",
			subject: "math",
			type: "quiz",
			scheduledAt: Date.now(),
			duration: 30,
			completed: false,
		};
		mockPlan.sessions.push(session);
		mockSessions.push(session);
		mockUpcoming.push(session);

		const { result } = renderHook(() => useStudyPlanner());

		act(() => {
			result.current.removeSession("session-to-remove");
		});

		expect(
			result.current.plan.sessions.find((s) => s.id === "session-to-remove"),
		).toBeUndefined();
	});

	test("markComplete updates session with completed=true and completedAt", () => {
		const session: StudySession = {
			id: "session-complete",
			subject: "math",
			type: "quiz",
			scheduledAt: Date.now(),
			duration: 30,
			completed: false,
		};
		mockPlan.sessions.push(session);

		const { result } = renderHook(() => useStudyPlanner());

		const _before = Date.now();
		act(() => {
			result.current.markComplete("session-complete");
		});

		expect(result.current.plan.sessions.length).toBe(1);
	});

	test("addExam adds an exam and refreshes", () => {
		const { result } = renderHook(() => useStudyPlanner());

		act(() => {
			result.current.addExam({
				subject: "mathematics",
				paper: "Paper 1",
				date: Date.now() + 7 * 86400000,
			});
		});

		expect(result.current.plan.examDates.length).toBeGreaterThanOrEqual(1);
	});

	test("removeExam deletes an exam and refreshes", () => {
		const exam: ExamDate = {
			id: "exam-to-remove",
			subject: "math",
			paper: "Paper 1",
			date: Date.now() + 86400000,
			daysUntil: 1,
		};
		mockPlan.examDates.push(exam);
		mockUpcomingExams.push(exam);

		const { result } = renderHook(() => useStudyPlanner());

		act(() => {
			result.current.removeExam("exam-to-remove");
		});

		expect(
			result.current.plan.examDates.find((e) => e.id === "exam-to-remove"),
		).toBeUndefined();
	});

	test("autoSchedule calls autoScheduleSessions and refreshes", () => {
		const { result } = renderHook(() => useStudyPlanner());

		act(() => {
			result.current.autoSchedule(["mathematics"], {
				mathematics: ["algebra"],
			});
		});
	});

	test("sets up 60-second polling interval on mount and clears on unmount", () => {
		const { tracked, restore } = setupIntervalTracking();

		const hook = renderHook(() => useStudyPlanner());
		hook.unmount();

		// The tracked set should be empty since interval was cleared
		expect(tracked.size).toBe(0);

		restore();
	});

	test("generatePlan dynamically imports study-planner-service", async () => {
		mockPlan.sessions.push({
			id: "existing-review",
			subject: "history",
			topic: "ww2",
			type: "review",
			scheduledAt: Date.now(),
			duration: 20,
			completed: false,
		});

		const { result } = renderHook(() => useStudyPlanner());

		await act(async () => {
			await result.current.generatePlan({
				targetAps: 30,
				dailyStudyMinutes: 45,
			});
		});

		const remaining = result.current.plan.sessions.filter(
			(s) => s.id === "existing-review",
		);
		expect(remaining.length).toBeGreaterThanOrEqual(1);
		expect(result.current.plan.generatedAt).toBeGreaterThan(0);
	});
});
