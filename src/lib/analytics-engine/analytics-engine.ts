import { dexieDataAccess } from "@/lib/db";
import type { CompetencyDataAccess } from "@/lib/db/data-access";
import type {
  AnalyticsRecommendation,
  OverallAnalytics,
  PerformanceHistoryItem,
  SubjectAnalytics,
  TopicPerformance,
} from "./types";

interface TopicGroup {
  scores: number[];
  attemptCounts: number[];
  lastAssessedList: number[];
}

function groupByTopic(
  competencies: Array<{
    topicId: string;
    score: number;
    attempts: number;
    lastAssessed: number;
  }>,
): Map<string, TopicGroup> {
  const map = new Map<string, TopicGroup>();
  for (const c of competencies) {
    const g = map.get(c.topicId) ?? {
      scores: [],
      attemptCounts: [],
      lastAssessedList: [],
    };
    g.scores.push(c.score);
    g.attemptCounts.push(c.attempts);
    g.lastAssessedList.push(c.lastAssessed);
    map.set(c.topicId, g);
  }
  return map;
}

function getWeakTopics(topicStats: TopicPerformance[]): TopicPerformance[] {
  return topicStats.filter((t) => t.accuracy < 0.6).sort((a, b) => a.accuracy - b.accuracy);
}

function getStrongTopics(topicStats: TopicPerformance[]): TopicPerformance[] {
  return topicStats.filter((t) => t.accuracy >= 0.8).sort((a, b) => b.accuracy - a.accuracy);
}

function generateInsights(
  subjects: SubjectAnalytics[],
  totalQuestions: number,
  totalCorrect: number,
): string[] {
  const insights: string[] = [];

  if (totalQuestions === 0) {
    insights.push("Start your first quiz to begin tracking your progress!");
    return insights;
  }

  const avgAccuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

  if (avgAccuracy >= 0.9) {
    insights.push("Outstanding! You're maintaining 90%+ accuracy across subjects.");
  } else if (avgAccuracy >= 0.7) {
    insights.push("Great progress! You're averaging 70%+ accuracy. Keep it up!");
  } else if (avgAccuracy >= 0.5) {
    insights.push("You're making progress. Focus on understanding the fundamentals.");
  } else {
    insights.push("Let's turn this around. Start with easier topics to build confidence.");
  }

  subjects.forEach((subject) => {
    if (subject.weakTopics.length > 2) {
      insights.push(
        `${subject.subjectName}: Focus on ${subject.weakTopics[0].topic} \u2014 it's your weakest area.`,
      );
    }
    if (subject.accuracy >= 0.9) {
      insights.push(
        `You've mastered ${subject.subjectName}! Consider helping peers or teaching the topic.`,
      );
    }
  });

  const recentSubjects = subjects.filter(
    (s) => s.lastAttemptAt && Date.now() - s.lastAttemptAt < 24 * 60 * 60 * 1000,
  );
  if (recentSubjects.length === 0) {
    insights.push("You haven't studied recently. Set a daily reminder to maintain your streak!");
  }

  return insights;
}

function generateRecommendations(subjects: SubjectAnalytics[]): AnalyticsRecommendation[] {
  const recommendations: AnalyticsRecommendation[] = [];

  const weakSubjects = subjects
    .filter((s) => s.weakTopics.length > 0)
    .sort((a, b) => {
      const aAccuracy = a.weakTopics[0]?.accuracy || 0;
      const bAccuracy = b.weakTopics[0]?.accuracy || 0;
      return aAccuracy - bAccuracy;
    });

  if (weakSubjects.length > 0) {
    const worst = weakSubjects[0];
    recommendations.push({
      type: "practice",
      subject: worst.subjectName,
      topic: worst.weakTopics[0]?.topic,
      message: `Practice ${worst.weakTopics[0]?.topic} in ${worst.subjectName} \u2014 only ${Math.round(worst.weakTopics[0]?.accuracy * 100)}% accuracy`,
      priority: 1,
    });
  }

  const strongSubjects = subjects
    .filter((s) => s.accuracy >= 0.8)
    .sort((a, b) => b.accuracy - a.accuracy);

  if (strongSubjects.length > 0) {
    recommendations.push({
      type: "exam",
      subject: strongSubjects[0].subjectName,
      message: `Great ${strongSubjects[0].subjectName} skills! Try an exam paper to test yourself.`,
      priority: 2,
    });
  }

  const inactiveSubjects = subjects.filter(
    (s) => !s.lastAttemptAt || Date.now() - s.lastAttemptAt > 3 * 24 * 60 * 60 * 1000,
  );

  if (inactiveSubjects.length > 0) {
    recommendations.push({
      type: "practice",
      subject: inactiveSubjects[0].subjectName,
      message: `Time to review ${inactiveSubjects[0].subjectName} \u2014 haven't practiced in 3+ days!`,
      priority: 3,
    });
  }

  recommendations.push({
    type: "rest",
    message: "Remember to take breaks \u2014 study smarter, not just harder!",
    priority: 10,
  });

  return recommendations.sort((a, b) => a.priority - b.priority);
}

class AnalyticsEngine {
  private db: CompetencyDataAccess;

  constructor(deps?: { db?: CompetencyDataAccess }) {
    this.db = deps?.db ?? dexieDataAccess;
  }

  async compute(_userId?: string): Promise<OverallAnalytics> {
    const [competencies, progressRecords, attempts] = await Promise.all([
      this.db.competencies.toArray(),
      this.db.progress.toArray(),
      this.db.quizAttempts.toArray(),
    ]);

    const subjectIds = new Set([
      ...competencies.map((c) => c.subjectId),
      ...progressRecords.map((p) => p.odSubjectId),
      ...attempts.map((a) => a.odSubject),
    ]);

    const subjects: SubjectAnalytics[] = [];

    const progressBySubject = new Map(progressRecords.map((p) => [p.odSubjectId, p]));

    for (const subjectId of subjectIds) {
      const subjectComps = competencies.filter((c) => c.subjectId === subjectId);
      const subjectProgress = progressBySubject.get(subjectId);
      const subjectAttempts = attempts.filter((a) => a.odSubject === subjectId);

      const topicMap = groupByTopic(subjectComps);
      const topicStats: TopicPerformance[] = [];

      for (const [topicId, data] of topicMap) {
        const avgScore = data.scores.reduce((s, v) => s + v, 0) / data.scores.length;
        const totalAttempts = data.attemptCounts.reduce((s, v) => s + v, 0);
        topicStats.push({
          topic: topicId,
          total: totalAttempts,
          correct: Math.round(totalAttempts * (avgScore / 100)),
          accuracy: avgScore / 100,
          avgTime: 0,
          lastAttempt: Math.max(...data.lastAssessedList),
        });
      }

      const totalQuestions = subjectProgress?.questionsAttempted ?? 0;
      const correctCount = subjectProgress?.correctCount ?? 0;

      const subjectHistory: PerformanceHistoryItem[] = subjectAttempts.map((a) => ({
        date: new Date(a.completedAt).toISOString().split("T")[0],
        questions: a.totalQuestions,
        correct: Math.round((a.score / 100) * a.totalQuestions),
        accuracy: a.totalQuestions > 0 ? a.score / 100 : 0,
        duration: a.duration,
      }));

      subjects.push({
        subjectId,
        subjectName: subjectId,
        totalQuestions,
        correctCount,
        accuracy: totalQuestions > 0 ? correctCount / totalQuestions : 0,
        currentStreak: subjectProgress?.currentStreak ?? 0,
        longestStreak: subjectProgress?.longestStreak ?? 0,
        lastAttemptAt:
          subjectComps.length > 0 ? Math.max(...subjectComps.map((c) => c.lastAssessed)) : null,
        weakTopics: getWeakTopics(topicStats),
        strongTopics: getStrongTopics(topicStats),
        history: subjectHistory.slice(-30),
      });
    }

    subjects.sort((a, b) => a.subjectName.localeCompare(b.subjectName));

    const totalQuestions = subjects.reduce((sum, s) => sum + s.totalQuestions, 0);
    const totalCorrect = subjects.reduce((sum, s) => sum + s.correctCount, 0);
    const totalStudyTime = attempts.reduce((sum, a) => sum + a.duration, 0);

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const dailyMap = new Map<string, { questions: number; correct: number; duration: number }>();
    for (const a of attempts) {
      if (a.completedAt < sevenDaysAgo) continue;
      const date = new Date(a.completedAt).toISOString().split("T")[0];
      const existing = dailyMap.get(date) ?? {
        questions: 0,
        correct: 0,
        duration: 0,
      };
      existing.questions += a.totalQuestions;
      existing.correct += Math.round((a.score / 100) * a.totalQuestions);
      existing.duration += a.duration;
      dailyMap.set(date, existing);
    }

    const weeklyProgress: PerformanceHistoryItem[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        questions: data.questions,
        correct: data.correct,
        accuracy: data.questions > 0 ? data.correct / data.questions : 0,
        duration: data.duration,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const insights = generateInsights(subjects, totalQuestions, totalCorrect);
    const recommendations = generateRecommendations(subjects);

    return {
      totalQuestions,
      totalCorrect,
      overallAccuracy: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
      currentStreak: Math.max(...subjects.map((s) => s.currentStreak), 0),
      longestStreak: Math.max(...subjects.map((s) => s.longestStreak), 0),
      totalStudyTime,
      subjects,
      weeklyProgress,
      insights,
      recommendations,
    };
  }
}

export const analyticsEngine = new AnalyticsEngine();
