import type { StoredGamification } from "./types";

export function checkAndUnlockAchievements(
  data: StoredGamification,
  questionsAnswered: number,
  accuracy: number,
  streak: number,
  currentLevel: number,
  perfectQuiz: boolean,
  extra?: {
    competentTopicsCount?: number;
    topicScoreImproved?: boolean;
    examScoreImproved?: boolean;
    leaderboardRank?: number;
    subjectLeaderboardRank?: number;
  },
): string[] {
  const newAchievements: string[] = [];
  const earned = new Set(data.achievements.map((a) => a.id));

  const checks: [string, boolean][] = [
    ["first_question", questionsAnswered >= 1 && !earned.has("first_question")],
    ["streak_3", streak >= 3 && !earned.has("streak_3")],
    ["streak_7", streak >= 7 && !earned.has("streak_7")],
    ["streak_30", streak >= 30 && !earned.has("streak_30")],
    ["questions_50", questionsAnswered >= 50 && !earned.has("questions_50")],
    ["questions_100", questionsAnswered >= 100 && !earned.has("questions_100")],
    ["questions_500", questionsAnswered >= 500 && !earned.has("questions_500")],
    ["accuracy_80", accuracy >= 80 && !earned.has("accuracy_80")],
    ["accuracy_90", accuracy >= 90 && !earned.has("accuracy_90")],
    ["perfect_quiz", perfectQuiz && !earned.has("perfect_quiz")],
    ["level_5", currentLevel >= 5 && !earned.has("level_5")],
    ["level_10", currentLevel >= 10 && !earned.has("level_10")],
    [
      "mistake_review_master",
      (data.wrongAnswersReviewed ?? 0) >= 20 && !earned.has("mistake_review_master"),
    ],
    [
      "flashcard_focused_50",
      (data.consecutiveCorrectFlashcards ?? 0) >= 50 && !earned.has("flashcard_focused_50"),
    ],
    [
      "study_plan_streak_7",
      (data.studyPlanDaysCompleted ?? 0) >= 7 && !earned.has("study_plan_streak_7"),
    ],
  ];

  const subjectCounts = data.subjectQuestionCounts;
  const subjectsWithActivity = Object.keys(subjectCounts).filter(
    (s) => subjectCounts[s] > 0,
  ).length;

  const subjectChecks: [string, boolean][] = [
    ["subject_math_50", (subjectCounts.mathematics ?? 0) >= 50 && !earned.has("subject_math_50")],
    [
      "subject_math_200",
      (subjectCounts.mathematics ?? 0) >= 200 && !earned.has("subject_math_200"),
    ],
    [
      "subject_science_50",
      (subjectCounts.physical_sciences ?? 0) >= 50 && !earned.has("subject_science_50"),
    ],
    [
      "subject_science_200",
      (subjectCounts.physical_sciences ?? 0) >= 200 && !earned.has("subject_science_200"),
    ],
    [
      "subject_language_50",
      (subjectCounts.english ?? 0) >= 50 && !earned.has("subject_language_50"),
    ],
    [
      "subject_language_200",
      (subjectCounts.english ?? 0) >= 200 && !earned.has("subject_language_200"),
    ],
    [
      "subject_commerce_50",
      (subjectCounts.accounting ?? 0) >= 50 && !earned.has("subject_commerce_50"),
    ],
    [
      "subject_commerce_200",
      (subjectCounts.accounting ?? 0) >= 200 && !earned.has("subject_commerce_200"),
    ],
    ["subjects_all_5", subjectsWithActivity >= 5 && !earned.has("subjects_all_5")],
  ];

  const extraChecks: [string, boolean][] = [
    [
      "competency_climber",
      (extra?.competentTopicsCount ?? 0) >= 5 && !earned.has("competency_climber"),
    ],
    ["weakness_slayer", (extra?.topicScoreImproved ?? false) && !earned.has("weakness_slayer")],
    ["exam_comeback", (extra?.examScoreImproved ?? false) && !earned.has("exam_comeback")],
    [
      "leaderboard_top_50",
      (extra?.leaderboardRank ?? 999) <= 50 && !earned.has("leaderboard_top_50"),
    ],
    [
      "leaderboard_top_10",
      (extra?.leaderboardRank ?? 999) <= 10 && !earned.has("leaderboard_top_10"),
    ],
    [
      "leaderboard_subject_top_10",
      (extra?.subjectLeaderboardRank ?? 999) <= 10 && !earned.has("leaderboard_subject_top_10"),
    ],
  ];

  for (const [id, shouldUnlock] of [...checks, ...subjectChecks, ...extraChecks]) {
    if (shouldUnlock) newAchievements.push(id);
  }

  return newAchievements;
}
