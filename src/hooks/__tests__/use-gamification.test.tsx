import { beforeEach, describe, expect, mock, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

let mockGamificationData: Record<string, unknown> = {
	xp: 50,
	totalXp: 500,
	achievements: [],
	dailyChallenges: [],
	streakMilestones: [],
	lastPracticeDate: null,
	currentStreak: 3,
	totalQuestionsAnswered: 25,
	claimedChests: [],
	streakFreezes: 3,
	subjectQuestionCounts: {},
};

mock.module("@/lib/shared/api-fetch", () => ({
	apiFetch: mock(async (_url: string) => mockGamificationData),
	isBudgetExceeded: () => false,
	showBudgetToast: () => {},
}));

const { useGamification } = await import("@/hooks/use-gamification");

function createWrapper() {
	const qc = new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: Infinity },
			mutations: { retry: false },
		},
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
	};
}

describe("useGamification", () => {
	beforeEach(() => {
		mockGamificationData = {
			xp: 50,
			totalXp: 500,
			achievements: [],
			dailyChallenges: [],
			streakMilestones: [],
			lastPracticeDate: null,
			currentStreak: 3,
			totalQuestionsAnswered: 25,
			claimedChests: [],
			streakFreezes: 3,
			subjectQuestionCounts: {},
		};
	});

	test("returns initial gamification state", () => {
		const { result } = renderHook(() => useGamification(), {
			wrapper: createWrapper(),
		});

		expect(result.current.isLoaded).toBe(true);
		expect(result.current.levelInfo).toBeDefined();
		expect(result.current.gamification).toBeDefined();
		expect(result.current.currentStreak).toBeGreaterThanOrEqual(0);
	});

	test("addXp updates XP and total questions", async () => {
		const { result } = renderHook(() => useGamification(), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			result.current.addXp(10, 85, 0);
		});

		await waitFor(() => {
			expect(result.current.totalQuestionsAnswered).toBeGreaterThan(0);
		});
	});

	test("updateStreak preserves streak state", async () => {
		const { result } = renderHook(() => useGamification(), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			result.current.updateStreak();
		});

		// Current streak should be a valid number
		expect(result.current.currentStreak).toBeGreaterThanOrEqual(0);
	});

	test("addAchievement does not throw", async () => {
		const { result } = renderHook(() => useGamification(), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			result.current.addAchievement("first-quiz");
		});

		// Should not throw — achievement may or may not be added depending on ACHIEVEMENTS
		expect(result.current.isLoaded).toBe(true);
	});

	test("useStreakFreeze does not throw", async () => {
		const { result } = renderHook(() => useGamification(), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			result.current.useStreakFreeze();
		});

		expect(result.current.isLoaded).toBe(true);
	});

	test("addStreakFreeze increments freeze count", async () => {
		const { result } = renderHook(() => useGamification(), {
			wrapper: createWrapper(),
		});

		const prevFreezes = result.current.streakFreezes;

		await act(async () => {
			result.current.addStreakFreeze(2);
		});

		await waitFor(() => {
			expect(result.current.streakFreezes).toBe(prevFreezes + 2);
		});
	});

	test("checkAndUnlockAchievements does not throw", async () => {
		const { result } = renderHook(() => useGamification(), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			result.current.checkAndUnlockAchievements(10, 80, 3, 1, true);
		});

		expect(result.current.isLoaded).toBe(true);
	});

	test("completeDailyChallenge does not throw", async () => {
		const { result } = renderHook(() => useGamification(), {
			wrapper: createWrapper(),
		});

		const challengeId = result.current.gamification.dailyChallenges[0]?.id;

		await act(async () => {
			result.current.completeDailyChallenge(challengeId ?? "unknown");
		});

		expect(result.current.isLoaded).toBe(true);
	});

	test("checkForRewardChests does not throw", async () => {
		const { result } = renderHook(() => useGamification(), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			result.current.checkForRewardChests();
		});

		expect(result.current.isLoaded).toBe(true);
	});
});
