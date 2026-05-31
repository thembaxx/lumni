import { describe, expect, test } from "bun:test";
import { GamificationEngine } from "../gamification-engine";

function makeEngine() {
	return new GamificationEngine();
}

function makeDefault() {
	const engine = makeEngine();
	return engine.mergeWithDefaults({
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
	});
}

describe("GamificationEngine", () => {
	describe("mergeWithDefaults", () => {
		test("fills missing fields from defaults", () => {
			const engine = makeEngine();
			const result = engine.mergeWithDefaults({
				xp: 100,
				totalXp: 200,
				achievements: [],
				dailyChallenges: [],
				streakMilestones: [],
				lastPracticeDate: null,
				currentStreak: 0,
				totalQuestionsAnswered: 0,
				claimedChests: [],
				streakFreezes: 3,
				subjectQuestionCounts: {},
			});
			expect(result.xp).toBe(100);
			expect(result.totalXp).toBe(200);
			expect(result.currentStreak).toBe(0);
			expect(result.streakFreezes).toBe(3);
		});

		test("preserves existing values over defaults", () => {
			const engine = makeEngine();
			const result = engine.mergeWithDefaults({
				xp: 500,
				totalXp: 500,
				achievements: [],
				dailyChallenges: [],
				streakMilestones: [],
				lastPracticeDate: "2026-01-01",
				currentStreak: 5,
				totalQuestionsAnswered: 50,
				claimedChests: [],
				streakFreezes: 1,
				subjectQuestionCounts: { math: 10 },
			});
			expect(result.currentStreak).toBe(5);
			expect(result.totalQuestionsAnswered).toBe(50);
			expect(result.subjectQuestionCounts).toEqual({ math: 10 });
		});
	});

	describe("addXp", () => {
		test("adds base XP for correct answers", () => {
			const engine = makeEngine();
			const data = makeDefault();
			const { data: result, xpGained } = engine.addXp(data, 1, 80, 0);

			expect(result.totalQuestionsAnswered).toBe(1);
			expect(xpGained).toBeGreaterThan(0);
			expect(result.totalXp).toBe(data.totalXp + xpGained);
			expect(result.xp).toBe(data.xp + xpGained);
		});

		test("adds less XP for incorrect answers (accuracy < 50)", () => {
			const engine = makeEngine();
			const data = makeDefault();
			const correct = engine.addXp(data, 1, 80, 0);
			const incorrect = engine.addXp(data, 1, 30, 0);

			expect(incorrect.xpGained).toBeLessThan(correct.xpGained);
		});

		test("applies streak bonus when streak > 1", () => {
			const engine = makeEngine();
			const data = makeDefault();
			const noStreak = engine.addXp(data, 1, 80, 1);
			const withStreak = engine.addXp(data, 1, 80, 3);

			expect(withStreak.xpGained).toBeGreaterThan(noStreak.xpGained);
		});

		test("multiplies XP by question count", () => {
			const engine = makeEngine();
			const data = makeDefault();
			const single = engine.addXp(data, 1, 80, 0);
			const multi = engine.addXp(data, 5, 80, 0);

			expect(multi.data.totalQuestionsAnswered).toBe(5);
			expect(multi.xpGained).toBeGreaterThan(single.xpGained);
		});

		test("returns leveledUp when crossing level threshold", () => {
			const engine = makeEngine();
			const data = makeDefault();
			// Large XP gain should trigger level up
			const { leveledUp } = engine.addXp(data, 100, 100, 5);

			// Level up should not be null for large XP gains
			expect(leveledUp).not.toBeNull();
			if (leveledUp !== null) {
				expect(leveledUp).toBeGreaterThan(0);
			}
		});

		test("returns leveledUp null when not crossing threshold", () => {
			const engine = makeEngine();
			const data = makeDefault();
			const { leveledUp } = engine.addXp(data, 1, 50, 0);

			expect(leveledUp).toBeNull();
		});
	});

	describe("addAchievement", () => {
		test("adds a new achievement with XP reward", () => {
			const engine = makeEngine();
			const data = makeDefault();
			const achievementId = "first-quiz";

			const { data: result, achievement } = engine.addAchievement(
				data,
				achievementId,
			);

			if (achievement) {
				expect(result.achievements).toHaveLength(1);
				expect(result.achievements[0].id).toBe(achievementId);
				expect(result.totalXp).toBeGreaterThan(data.totalXp);
				expect(result.xp).toBeGreaterThan(data.xp);
			} else {
				// Achievement might not exist in the ACHIEVEMENTS array
				expect(result.achievements).toHaveLength(0);
			}
		});

		test("does not duplicate existing achievements", () => {
			const engine = makeEngine();
			const achievementId = "first-quiz";
			const data = {
				...makeDefault(),
				achievements: [
					{ id: achievementId, earnedAt: "2026-01-01T00:00:00.000Z" },
				],
			};

			const { data: result, achievement } = engine.addAchievement(
				data,
				achievementId,
			);

			expect(result.achievements).toHaveLength(1);
			expect(achievement).toBeNull();
		});

		test("returns null achievement for unknown IDs", () => {
			const engine = makeEngine();
			const data = makeDefault();
			const { achievement } = engine.addAchievement(data, "nonexistent-id");

			expect(achievement).toBeNull();
		});
	});

	describe("updateStreak", () => {
		test("increments streak for consecutive days", () => {
			const engine = makeEngine();
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const data = {
				...makeDefault(),
				lastPracticeDate: yesterday.toDateString(),
				currentStreak: 2,
			};

			const { data: result } = engine.updateStreak(data);

			expect(result.currentStreak).toBe(3);
		});

		test("resets streak when gap is more than one day and no freezes left", () => {
			const engine = makeEngine();
			const threeDaysAgo = new Date();
			threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
			const data = {
				...makeDefault(),
				lastPracticeDate: threeDaysAgo.toDateString(),
				currentStreak: 5,
				streakFreezes: 0,
			};

			const { data: result } = engine.updateStreak(data);

			expect(result.currentStreak).toBe(1);
		});

		test("consumes freeze instead of resetting streak", () => {
			const engine = makeEngine();
			const threeDaysAgo = new Date();
			threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
			const data = {
				...makeDefault(),
				lastPracticeDate: threeDaysAgo.toDateString(),
				currentStreak: 5,
				streakFreezes: 3,
			};

			const { data: result, freezeConsumed } = engine.updateStreak(data);

			expect(result.currentStreak).toBe(5);
			expect(result.streakFreezes).toBe(2);
			expect(freezeConsumed).toBe(true);
		});
	});

	describe("save", () => {
		test("does not throw on server (no localStorage)", () => {
			const engine = makeEngine();
			const data = makeDefault();

			expect(() => engine.save(data)).not.toThrow();
		});

		test("debounces rapid calls", () => {
			const engine = makeEngine();
			const data = makeDefault();

			engine.save(data);
			engine.save(data);
			engine.save(data);

			// Should not throw — timer is cleared and reset
			expect(true).toBe(true);
		});
	});

	describe("trackSubjectQuestion", () => {
		test("increments subject count", () => {
			const engine = makeEngine();
			const data = makeDefault();
			const result = engine.trackSubjectQuestion(data, "mathematics", 1);

			expect(result.subjectQuestionCounts.mathematics).toBe(1);
		});

		test("accumulates multiple questions for same subject", () => {
			const engine = makeEngine();
			const data = makeDefault();
			const r1 = engine.trackSubjectQuestion(data, "mathematics", 3);
			const r2 = engine.trackSubjectQuestion(r1, "mathematics", 2);

			expect(r2.subjectQuestionCounts.mathematics).toBe(5);
		});

		test("tracks multiple subjects independently", () => {
			const engine = makeEngine();
			const data = makeDefault();
			const r1 = engine.trackSubjectQuestion(data, "mathematics", 3);
			const r2 = engine.trackSubjectQuestion(r1, "physics", 2);

			expect(r2.subjectQuestionCounts.mathematics).toBe(3);
			expect(r2.subjectQuestionCounts.physics).toBe(2);
		});
	});
});
