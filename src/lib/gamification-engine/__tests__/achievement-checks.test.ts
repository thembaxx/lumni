import { describe, expect, test } from "vitest";
import { checkAndUnlockAchievements } from "../achievement-checks";
import type { StoredGamification } from "../types";

function baseData(overrides?: Partial<StoredGamification>): StoredGamification {
  return {
    xp: 0,
    totalXp: 0,
    achievements: [],
    dailyChallenges: [],
    streakMilestones: [],
    lastPracticeDate: null,
    currentStreak: 0,
    totalQuestionsAnswered: 0,
    claimedChests: [],
    streakFreezes: 0,
    streakFreezeUsedToday: false,
    freezeEvents: [],
    subjectQuestionCounts: {},
    ...overrides,
  };
}

describe("checkAndUnlockAchievements", () => {
  describe("core checks", () => {
    test("first_question at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 1, 0, 0, 0, false);
      expect(result).toContain("first_question");
    });

    test("first_question not unlocked at zero", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).not.toContain("first_question");
    });

    test("streak_3 at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 3, 0, false);
      expect(result).toContain("streak_3");
    });

    test("streak_7 at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 7, 0, false);
      expect(result).toContain("streak_7");
    });

    test("streak_30 at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 30, 0, false);
      expect(result).toContain("streak_30");
    });

    test("streak_3 not unlocked below threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 2, 0, false);
      expect(result).not.toContain("streak_3");
    });

    test("questions_50 at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 50, 0, 0, 0, false);
      expect(result).toContain("questions_50");
    });

    test("questions_100 at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 100, 0, 0, 0, false);
      expect(result).toContain("questions_100");
    });

    test("questions_500 at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 500, 0, 0, 0, false);
      expect(result).toContain("questions_500");
    });

    test("questions_100 unlocks alongside questions_50", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 100, 0, 0, 0, false);
      expect(result).toContain("questions_50");
      expect(result).toContain("questions_100");
    });

    test("accuracy_80 at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 80, 0, 0, false);
      expect(result).toContain("accuracy_80");
    });

    test("accuracy_90 at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 90, 0, 0, false);
      expect(result).toContain("accuracy_90");
    });

    test("accuracy_80 not unlocked below threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 79, 0, 0, false);
      expect(result).not.toContain("accuracy_80");
    });

    test("perfect_quiz unlocks when true", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, true);
      expect(result).toContain("perfect_quiz");
    });

    test("perfect_quiz not unlocked when false", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).not.toContain("perfect_quiz");
    });

    test("level_5 at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 5, false);
      expect(result).toContain("level_5");
    });

    test("level_10 at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 10, false);
      expect(result).toContain("level_10");
    });

    test("level_5 not unlocked below threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 4, false);
      expect(result).not.toContain("level_5");
    });

    test("mistake_review_master at threshold", () => {
      const data = baseData({ wrongAnswersReviewed: 20 });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).toContain("mistake_review_master");
    });

    test("mistake_review_master not unlocked below threshold", () => {
      const data = baseData({ wrongAnswersReviewed: 19 });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).not.toContain("mistake_review_master");
    });

    test("mistake_review_master uses 0 when undefined", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).not.toContain("mistake_review_master");
    });

    test("flashcard_focused_50 at threshold", () => {
      const data = baseData({ consecutiveCorrectFlashcards: 50 });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).toContain("flashcard_focused_50");
    });

    test("flashcard_focused_50 not unlocked below threshold", () => {
      const data = baseData({ consecutiveCorrectFlashcards: 49 });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).not.toContain("flashcard_focused_50");
    });

    test("study_plan_streak_7 at threshold", () => {
      const data = baseData({ studyPlanDaysCompleted: 7 });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).toContain("study_plan_streak_7");
    });

    test("study_plan_streak_7 not unlocked below threshold", () => {
      const data = baseData({ studyPlanDaysCompleted: 6 });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).not.toContain("study_plan_streak_7");
    });
  });

  describe("subject checks", () => {
    test("subject_math_50 at threshold", () => {
      const data = baseData({ subjectQuestionCounts: { mathematics: 50 } });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).toContain("subject_math_50");
    });

    test("subject_math_200 at threshold", () => {
      const data = baseData({ subjectQuestionCounts: { mathematics: 200 } });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).toContain("subject_math_200");
    });

    test("subject_science_50 at threshold", () => {
      const data = baseData({ subjectQuestionCounts: { physical_sciences: 50 } });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).toContain("subject_science_50");
    });

    test("subject_science_200 at threshold", () => {
      const data = baseData({ subjectQuestionCounts: { physical_sciences: 200 } });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).toContain("subject_science_200");
    });

    test("subject_language_50 at threshold", () => {
      const data = baseData({ subjectQuestionCounts: { english: 50 } });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).toContain("subject_language_50");
    });

    test("subject_language_200 at threshold", () => {
      const data = baseData({ subjectQuestionCounts: { english: 200 } });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).toContain("subject_language_200");
    });

    test("subject_commerce_50 at threshold", () => {
      const data = baseData({ subjectQuestionCounts: { accounting: 50 } });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).toContain("subject_commerce_50");
    });

    test("subject_commerce_200 at threshold", () => {
      const data = baseData({ subjectQuestionCounts: { accounting: 200 } });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).toContain("subject_commerce_200");
    });

    test("subjects_all_5 at threshold", () => {
      const data = baseData({
        subjectQuestionCounts: {
          mathematics: 1,
          physical_sciences: 1,
          english: 1,
          accounting: 1,
          geography: 1,
        },
      });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).toContain("subjects_all_5");
    });

    test("subjects_all_5 not unlocked with 4 subjects", () => {
      const data = baseData({
        subjectQuestionCounts: {
          mathematics: 1,
          physical_sciences: 1,
          english: 1,
          accounting: 1,
        },
      });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).not.toContain("subjects_all_5");
    });

    test("subject with zero count does not count for subjects_all_5", () => {
      const data = baseData({
        subjectQuestionCounts: {
          mathematics: 0,
          physical_sciences: 0,
          english: 0,
          accounting: 0,
          geography: 0,
        },
      });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).not.toContain("subjects_all_5");
    });
  });

  describe("extra checks", () => {
    test("competency_climber at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false, {
        competentTopicsCount: 5,
      });
      expect(result).toContain("competency_climber");
    });

    test("competency_climber not unlocked below threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false, {
        competentTopicsCount: 4,
      });
      expect(result).not.toContain("competency_climber");
    });

    test("competency_climber not unlocked when extra is undefined", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).not.toContain("competency_climber");
    });

    test("weakness_slayer unlocks when true", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false, {
        topicScoreImproved: true,
      });
      expect(result).toContain("weakness_slayer");
    });

    test("weakness_slayer not unlocked when false", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false, {
        topicScoreImproved: false,
      });
      expect(result).not.toContain("weakness_slayer");
    });

    test("exam_comeback unlocks when true", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false, {
        examScoreImproved: true,
      });
      expect(result).toContain("exam_comeback");
    });

    test("leaderboard_top_50 at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false, {
        leaderboardRank: 50,
      });
      expect(result).toContain("leaderboard_top_50");
    });

    test("leaderboard_top_10 at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false, {
        leaderboardRank: 10,
      });
      expect(result).toContain("leaderboard_top_10");
    });

    test("leaderboard_top_10 not unlocked above threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false, {
        leaderboardRank: 11,
      });
      expect(result).not.toContain("leaderboard_top_10");
    });

    test("leaderboard_subject_top_10 at threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false, {
        subjectLeaderboardRank: 10,
      });
      expect(result).toContain("leaderboard_subject_top_10");
    });

    test("leaderboard_subject_top_10 not unlocked above threshold", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false, {
        subjectLeaderboardRank: 11,
      });
      expect(result).not.toContain("leaderboard_subject_top_10");
    });
  });

  describe("deduplication", () => {
    test("already-earned achievement not returned", () => {
      const data = baseData({
        achievements: [{ id: "first_question", earnedAt: "2026-01-01" }],
      });
      const result = checkAndUnlockAchievements(data, 1, 0, 0, 0, false);
      expect(result).not.toContain("first_question");
    });

    test("already-earned streak achievements not returned", () => {
      const data = baseData({
        achievements: [{ id: "streak_3", earnedAt: "2026-01-01" }],
      });
      const result = checkAndUnlockAchievements(data, 5, 100, 7, 0, false);
      expect(result).not.toContain("streak_3");
      expect(result).toContain("streak_7");
    });

    test("all higher streak achievements still unlockable", () => {
      const data = baseData({
        achievements: [
          { id: "streak_3", earnedAt: "2026-01-01" },
          { id: "streak_7", earnedAt: "2026-01-01" },
        ],
      });
      const result = checkAndUnlockAchievements(data, 0, 0, 30, 0, false);
      expect(result).toContain("streak_30");
      expect(result).not.toContain("streak_3");
      expect(result).not.toContain("streak_7");
    });
  });

  describe("edge cases", () => {
    test("returns empty array for fresh data with no achievements met", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).toHaveLength(0);
    });

    test("lower threshold unlocks when higher threshold also met", () => {
      const data = baseData();
      const result = checkAndUnlockAchievements(data, 150, 0, 0, 0, false);
      expect(result).toContain("questions_50");
      expect(result).toContain("questions_100");
      expect(result).not.toContain("questions_500");
    });

    test("missing optional fields default to 0", () => {
      const data = baseData({
        wrongAnswersReviewed: undefined,
        consecutiveCorrectFlashcards: undefined,
        studyPlanDaysCompleted: undefined,
      });
      const result = checkAndUnlockAchievements(data, 0, 0, 0, 0, false);
      expect(result).not.toContain("mistake_review_master");
      expect(result).not.toContain("flashcard_focused_50");
      expect(result).not.toContain("study_plan_streak_7");
    });

    test("all three counter achievements can unlock simultaneously", () => {
      const data = baseData({
        wrongAnswersReviewed: 20,
        consecutiveCorrectFlashcards: 50,
        studyPlanDaysCompleted: 7,
      });
      const result = checkAndUnlockAchievements(data, 500, 95, 30, 10, false);
      expect(result).toContain("mistake_review_master");
      expect(result).toContain("flashcard_focused_50");
      expect(result).toContain("study_plan_streak_7");
    });

    test("empty subjectQuestionCounts does not crash", () => {
      const data = baseData({ subjectQuestionCounts: {} });
      const result = checkAndUnlockAchievements(data, 1, 0, 0, 0, false);
      expect(result).toContain("first_question");
    });
  });
});
