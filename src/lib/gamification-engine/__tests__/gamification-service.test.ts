import { beforeEach, describe, expect, test, vi } from "vitest";

const defaultState = {
  xp: 0,
  totalXp: 0,
  achievements: [],
  dailyChallenges: [],
  streakMilestones: [],
  lastPracticeDate: null,
  currentStreak: 0,
  totalQuestionsAnswered: 0,
  claimedChests: [],
  streakFreezes: 3,
  subjectQuestionCounts: {},
};

const {
  loadMock,
  mergeWithDefaultsMock,
  addXpMock,
  addAchievementMock,
  updateStreakMock,
  consumeStreakFreezeMock,
  checkAndClaimRewardChestMock,
  trackSubjectQuestionMock,
  addStreakFreezeMock,
  completeDailyChallengeMock,
  checkAndUnlockAchievementsMock,
  mockPut,
  mockGet,
  logErrorMock,
  apiFetchMock,
  saveWeeklySnapshotMock,
} = vi.hoisted(() => {
  const def = {
    xp: 0,
    totalXp: 0,
    achievements: [],
    dailyChallenges: [],
    streakMilestones: [],
    lastPracticeDate: null,
    currentStreak: 0,
    totalQuestionsAnswered: 0,
    claimedChests: [],
    streakFreezes: 3,
    subjectQuestionCounts: {},
  };
  return {
    loadMock: vi.fn(() => ({ ...def })),
    mergeWithDefaultsMock: vi.fn((d: Record<string, unknown>) => d as typeof def),
    addXpMock: vi.fn((data: Record<string, unknown>, amount: number) => ({
      data: {
        ...data,
        xp: ((data.xp as number) || 0) + amount,
        totalXp: ((data.totalXp as number) || 0) + amount,
      },
      leveledUp: null,
      xpGained: amount,
    })),
    addAchievementMock: vi.fn((data: Record<string, unknown>) => ({
      data,
      achievement: null,
    })),
    updateStreakMock: vi.fn((data: Record<string, unknown>) => ({
      data,
      milestoneXpGained: 0,
      freezeConsumed: false,
    })),
    consumeStreakFreezeMock: vi.fn((data: Record<string, unknown>) => ({
      data,
      success: false,
    })),
    checkAndClaimRewardChestMock: vi.fn((data: Record<string, unknown>) => ({
      data,
      chest: null,
    })),
    trackSubjectQuestionMock: vi.fn((data: Record<string, unknown>) => data),
    addStreakFreezeMock: vi.fn((data: Record<string, unknown>) => data),
    completeDailyChallengeMock: vi.fn((data: Record<string, unknown>) => ({
      data,
      xpReward: 0,
    })),
    checkAndUnlockAchievementsMock: vi.fn(() => []),
    mockPut: vi.fn(async () => 1),
    mockGet: vi.fn(async () => undefined),
    logErrorMock: vi.fn(),
    apiFetchMock: vi.fn(async () => ({ gamification: null })),
    saveWeeklySnapshotMock: vi.fn(),
  };
});

vi.mock("@/lib/gamification-engine", () => ({
  gamificationEngine: {
    load: loadMock,
    mergeWithDefaults: mergeWithDefaultsMock,
    addXp: addXpMock,
    addAchievement: addAchievementMock,
    updateStreak: updateStreakMock,
    consumeStreakFreeze: consumeStreakFreezeMock,
    checkAndClaimRewardChest: checkAndClaimRewardChestMock,
    trackSubjectQuestion: trackSubjectQuestionMock,
    addStreakFreeze: addStreakFreezeMock,
    completeDailyChallenge: completeDailyChallengeMock,
    checkAndUnlockAchievements: checkAndUnlockAchievementsMock,
  },
}));

vi.mock("@/lib/db", () => ({
  dexieDataAccess: {
    gamification: { get: mockGet, put: mockPut },
  },
}));

vi.mock("@/lib/shared/logger", () => ({
  logError: logErrorMock,
}));

vi.mock("@/lib/shared/api-fetch", () => ({
  apiFetch: apiFetchMock,
}));

vi.mock("@/lib/services/leaderboard-service", () => ({
  saveWeeklySnapshot: saveWeeklySnapshotMock,
}));

const { GamificationService } = await import("../service");

function createService() {
  return new GamificationService({
    db: {
      gamification: {
        get: mockGet,
        put: mockPut,
      },
    },
  });
}

describe("GamificationService", () => {
  beforeEach(() => {
    loadMock.mockClear();
    mergeWithDefaultsMock.mockClear();
    addXpMock.mockClear();
    addAchievementMock.mockClear();
    updateStreakMock.mockClear();
    consumeStreakFreezeMock.mockClear();
    checkAndClaimRewardChestMock.mockClear();
    trackSubjectQuestionMock.mockClear();
    addStreakFreezeMock.mockClear();
    completeDailyChallengeMock.mockClear();
    checkAndUnlockAchievementsMock.mockClear();
    mockPut.mockClear();
    mockGet.mockClear();
    logErrorMock.mockClear();
    apiFetchMock.mockClear();
    saveWeeklySnapshotMock.mockClear();

    loadMock.mockReturnValue({ ...defaultState });
    mergeWithDefaultsMock.mockImplementation((d: Record<string, unknown>) => d);
  });

  describe("subscribe / notify", () => {
    test("listener receives state on mutation", () => {
      const service = createService();
      const listener = vi.fn();
      service.subscribe(listener);

      addXpMock.mockReturnValue({
        data: { ...defaultState, xp: 10, totalXp: 10 },
        leveledUp: null,
        xpGained: 10,
      });
      service.addXp(10, 100, 0);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ xp: 10, totalXp: 10 }));
    });

    test("unsubscribe stops notifications", () => {
      const service = createService();
      const listener = vi.fn();
      const unsub = service.subscribe(listener);
      unsub();

      service.addXp(10, 100, 0);

      expect(listener).not.toHaveBeenCalled();
    });

    test("multiple listeners all notified", () => {
      const service = createService();
      const listenerA = vi.fn();
      const listenerB = vi.fn();
      service.subscribe(listenerA);
      service.subscribe(listenerB);

      service.addXp(10, 100, 0);

      expect(listenerA).toHaveBeenCalledTimes(1);
      expect(listenerB).toHaveBeenCalledTimes(1);
    });
  });

  describe("addXp", () => {
    test("delegates to engine and returns correct XpResult", () => {
      const service = createService();
      addXpMock.mockReturnValue({
        data: { ...defaultState, xp: 50, totalXp: 50 },
        leveledUp: null,
        xpGained: 50,
      });

      const result = service.addXp(5, 80, 2, "mathematics");

      expect(addXpMock).toHaveBeenCalledWith(expect.any(Object), 5, 80, 2, "mathematics");
      expect(result.data.xp).toBe(50);
      expect(result.leveledUp).toBe(false);
    });

    test("persists to Dexie after mutation", () => {
      const service = createService();
      addXpMock.mockReturnValue({
        data: { ...defaultState, xp: 25, totalXp: 25 },
        leveledUp: null,
        xpGained: 25,
      });

      service.addXp(3, 100, 1);

      expect(mockPut).toHaveBeenCalledTimes(1);
      const record = mockPut.mock.calls[0][0];
      expect(record.xp).toBe(25);
      expect(record.totalXp).toBe(25);
      expect(record.id).toBe(1);
    });

    test("notifies listeners after mutation", () => {
      const service = createService();
      const listener = vi.fn();
      service.subscribe(listener);

      addXpMock.mockReturnValue({
        data: { ...defaultState, xp: 15, totalXp: 15 },
        leveledUp: null,
        xpGained: 15,
      });
      service.addXp(2, 60, 0);

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ xp: 15 }));
    });

    test("reports leveledUp when engine returns a level", () => {
      const service = createService();
      addXpMock.mockReturnValue({
        data: { ...defaultState, xp: 1000, totalXp: 1000 },
        leveledUp: 5,
        xpGained: 1000,
      });

      const result = service.addXp(100, 100, 5);

      expect(result.leveledUp).toBe(true);
    });
  });

  describe("addAchievement", () => {
    test("delegates to engine and returns AchievementResult", () => {
      const service = createService();
      addAchievementMock.mockReturnValue({
        data: {
          ...defaultState,
          achievements: [{ id: "first_question", earnedAt: "2026-01-01T00:00:00.000Z" }],
          totalXp: 50,
        },
        achievement: {
          id: "first_question",
          name: "First Question",
          xpReward: 50,
        },
      });

      const result = service.addAchievement("first_question");

      expect(addAchievementMock).toHaveBeenCalledWith(expect.any(Object), "first_question");
      expect(result.achievement?.id).toBe("first_question");
      expect(result.data.achievements).toHaveLength(1);
    });

    test("persists and notifies after mutation", () => {
      const service = createService();
      const listener = vi.fn();
      service.subscribe(listener);

      addAchievementMock.mockReturnValue({
        data: {
          ...defaultState,
          achievements: [{ id: "streak_3", earnedAt: "2026-06-01T00:00:00.000Z" }],
          totalXp: 100,
        },
        achievement: { id: "streak_3", name: "Streak 3", xpReward: 100 },
      });

      service.addAchievement("streak_3");

      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateStreak", () => {
    test("delegates, persists, notifies", () => {
      const service = createService();
      const listener = vi.fn();
      service.subscribe(listener);

      updateStreakMock.mockReturnValue({
        data: {
          ...defaultState,
          currentStreak: 3,
          lastPracticeDate: "2026-06-21",
        },
        milestoneXpGained: 0,
        freezeConsumed: false,
      });

      const result = service.updateStreak();

      expect(updateStreakMock).toHaveBeenCalledWith(expect.any(Object));
      expect(result.data.currentStreak).toBe(3);
      expect(result.freezeConsumed).toBe(false);
      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test("returns StreakResult with correct shape", () => {
      const service = createService();

      updateStreakMock.mockReturnValue({
        data: {
          ...defaultState,
          currentStreak: 7,
          lastPracticeDate: "2026-06-21",
        },
        milestoneXpGained: 100,
        freezeConsumed: true,
      });

      const result = service.updateStreak();

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("freezeConsumed");
      expect(typeof result.freezeConsumed).toBe("boolean");
      expect(result.data.currentStreak).toBeGreaterThan(0);
    });
  });

  describe("consumeStreakFreeze", () => {
    test("on success: persists, syncs, notifies", () => {
      const service = createService();
      const listener = vi.fn();
      service.subscribe(listener);

      consumeStreakFreezeMock.mockReturnValue({
        data: { ...defaultState, streakFreezes: 2 },
        success: true,
      });

      const result = service.consumeStreakFreeze();

      expect(result.success).toBe(true);
      expect(result.data.streakFreezes).toBe(2);
      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test("on failure (0 freezes): does NOT persist or notify", () => {
      const service = createService();
      const listener = vi.fn();
      service.subscribe(listener);

      consumeStreakFreezeMock.mockReturnValue({
        data: { ...defaultState, streakFreezes: 0 },
        success: false,
      });

      const result = service.consumeStreakFreeze();

      expect(result.success).toBe(false);
      expect(mockPut).not.toHaveBeenCalled();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("checkForRewardChests", () => {
    test("with claimable chest: persists and notifies", () => {
      const service = createService();
      const listener = vi.fn();
      service.subscribe(listener);

      const chestData = {
        ...defaultState,
        claimedChests: [{ id: "chest_1000", claimedAt: "2026-06-21T00:00:00.000Z" }],
        totalXp: 1100,
      };
      checkAndClaimRewardChestMock.mockReturnValue({
        data: chestData,
        chest: {
          id: "chest_1000",
          name: "1000 XP",
          xpRequired: 1000,
          xpReward: 100,
        },
      });

      const result = service.checkForRewardChests();

      expect(result.chest?.id).toBe("chest_1000");
      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test("without claimable chest: still notifies, no persist", () => {
      const service = createService();
      const listener = vi.fn();
      service.subscribe(listener);

      checkAndClaimRewardChestMock.mockImplementation((data: Record<string, unknown>) => ({
        data,
        chest: null,
      }));

      const result = service.checkForRewardChests();

      expect(result.chest).toBeNull();
      expect(mockPut).not.toHaveBeenCalled();
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    test("Dexie persist failure: swallowed, logged", () => {
      const service = createService();
      const persistError = new Error("dexie write failed");
      mockPut.mockRejectedValueOnce(persistError);

      addXpMock.mockReturnValue({
        data: { ...defaultState, xp: 10, totalXp: 10 },
        leveledUp: null,
        xpGained: 10,
      });

      expect(() => service.addXp(1, 100, 0)).not.toThrow();

      return vi.waitFor(() => {
        expect(logErrorMock).toHaveBeenCalledWith("GamificationService.persist", persistError);
      });
    });

    test("API sync failure: swallowed, logged", async () => {
      vi.useFakeTimers();
      const service = createService();
      const syncError = new Error("network error");
      apiFetchMock.mockRejectedValueOnce(syncError);

      addXpMock.mockReturnValue({
        data: { ...defaultState, xp: 10, totalXp: 10 },
        leveledUp: null,
        xpGained: 10,
      });

      service.addXp(5, 80, 1);

      vi.advanceTimersByTime(2000);

      await Promise.resolve();

      expect(logErrorMock).toHaveBeenCalledWith("GamificationService.syncToServer", syncError);

      vi.useRealTimers();
    });
  });

  describe("debounce", () => {
    test("rapid addXp calls: only one sync fires after 2s", () => {
      vi.useFakeTimers();
      const service = createService();

      addXpMock.mockReturnValue({
        data: { ...defaultState, xp: 10, totalXp: 10 },
        leveledUp: null,
        xpGained: 10,
      });

      service.addXp(1, 100, 0);
      service.addXp(1, 100, 0);
      service.addXp(1, 100, 0);

      expect(apiFetchMock).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2000);

      expect(apiFetchMock).toHaveBeenCalledTimes(1);
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/gamification",
        expect.objectContaining({ method: "POST" }),
      );

      vi.useRealTimers();
    });

    test("intermediate timer is cleared before 2s elapses", () => {
      vi.useFakeTimers();
      const service = createService();

      addXpMock.mockReturnValue({
        data: { ...defaultState, xp: 10, totalXp: 10 },
        leveledUp: null,
        xpGained: 10,
      });

      service.addXp(1, 100, 0);
      vi.advanceTimersByTime(1000);
      service.addXp(1, 100, 0);
      vi.advanceTimersByTime(1000);

      expect(apiFetchMock).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(apiFetchMock).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });
});
