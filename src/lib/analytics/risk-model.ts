import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";

interface RiskFactor {
  type:
    | "streak_break"
    | "competency_decay"
    | "ease_hell"
    | "exam_gap"
    | "duration_drop"
    | "engagement_drop";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  value: number;
  threshold: number;
}

interface RiskScore {
  score: number; // 0-1
  level: "low" | "medium" | "high" | "critical";
  factors: RiskFactor[];
  recommendation: string;
}

interface StudentActivityData {
  quizStreak: number;
  lastQuizAt: number;
  competencyTrends: CompetencyTrend[];
  flashcardEaseHell: boolean;
  examPracticeGap: number;
  avgSessionDuration: number;
  prevAvgSessionDuration: number;
  activeDaysLast30: number;
  totalQuizzesLast30: number;
}

interface CompetencyTrend {
  topicId: string;
  subject: string;
  currentScore: number;
  prevScore: number;
  changePercent: number;
  attempts: number;
  lastAssessed: number;
}

interface RiskModelConfig {
  streakBreakDays: number;
  competencyDecayThreshold: number; // percentage drop
  easeHellInterval: number; // days
  easeHellEaseFactor: number;
  examGapDays: number;
  durationDropThreshold: number; // percentage
  engagementDropThreshold: number; // percentage
}

const DEFAULT_CONFIG: RiskModelConfig = {
  streakBreakDays: 3,
  competencyDecayThreshold: 15,
  easeHellInterval: 30,
  easeHellEaseFactor: 1.3,
  examGapDays: 14,
  durationDropThreshold: 30,
  engagementDropThreshold: 30,
};

export class RiskModel {
  private config: RiskModelConfig;
  private db: DataAccess;

  constructor(config: Partial<RiskModelConfig> = {}, db?: DataAccess) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.db = db ?? dexieDataAccess;
  }

  computeRisk(data: StudentActivityData): RiskScore {
    const factors: RiskFactor[] = [];
    let totalSeverity = 0;

    // Factor 1: Quiz streak break
    const streakBreak = this.checkStreakBreak(data);
    if (streakBreak) {
      factors.push(streakBreak);
      totalSeverity += this.severityWeight(streakBreak.severity);
    }

    // Factor 2: Competency decay
    const competencyDecay = this.checkCompetencyDecay(data);
    if (competencyDecay) {
      factors.push(competencyDecay);
      totalSeverity += this.severityWeight(competencyDecay.severity);
    }

    // Factor 3: Flashcard ease-hell
    const easeHell = this.checkEaseHell(data);
    if (easeHell) {
      factors.push(easeHell);
      totalSeverity += this.severityWeight(easeHell.severity);
    }

    // Factor 4: Exam practice gap
    const examGap = this.checkExamGap(data);
    if (examGap) {
      factors.push(examGap);
      totalSeverity += this.severityWeight(examGap.severity);
    }

    // Factor 5: Session duration drop
    const durationDrop = this.checkDurationDrop(data);
    if (durationDrop) {
      factors.push(durationDrop);
      totalSeverity += this.severityWeight(durationDrop.severity);
    }

    // Factor 6: Engagement drop
    const engagementDrop = this.checkEngagementDrop(data);
    if (engagementDrop) {
      factors.push(engagementDrop);
      totalSeverity += this.severityWeight(engagementDrop.severity);
    }

    // Calculate final score (0-1)
    const maxPossibleSeverity = factors.length * 3; // max severity = 3 (critical)
    const score = maxPossibleSeverity > 0 ? totalSeverity / maxPossibleSeverity : 0;

    // Determine level
    let level: RiskScore["level"] = "low";
    if (score >= 0.75) level = "critical";
    else if (score >= 0.5) level = "high";
    else if (score >= 0.25) level = "medium";

    // Generate recommendation
    const recommendation = this.generateRecommendation(factors);

    return {
      score: Math.min(1, Math.max(0, score)),
      level,
      factors,
      recommendation,
    };
  }

  async computeRiskScore(userId: string, windowDays: number = 14): Promise<RiskScore | null> {
    const data = await fetchStudentActivityData(this.db, userId, windowDays);
    if (!data) return null;
    return this.computeRisk(data);
  }

  private checkStreakBreak(data: StudentActivityData): RiskFactor | null {
    if (data.quizStreak === 0) return null;

    const daysSinceLastQuiz = Math.floor((Date.now() - data.lastQuizAt) / (1000 * 60 * 60 * 24));
    if (daysSinceLastQuiz <= this.config.streakBreakDays) return null;

    const severity =
      daysSinceLastQuiz > 14 ? "critical" : daysSinceLastQuiz > 7 ? "high" : "medium";
    return {
      type: "streak_break",
      severity,
      message: `No quiz activity for ${daysSinceLastQuiz} days (streak: ${data.quizStreak})`,
      value: daysSinceLastQuiz,
      threshold: this.config.streakBreakDays,
    };
  }

  private checkCompetencyDecay(data: StudentActivityData): RiskFactor | null {
    const decays = data.competencyTrends.filter(
      (t) => t.changePercent <= -this.config.competencyDecayThreshold,
    );
    if (decays.length === 0) return null;

    const worstDecay = decays.reduce((worst, curr) =>
      curr.changePercent < worst.changePercent ? curr : worst,
    );
    const severity =
      worstDecay.changePercent <= -30
        ? "critical"
        : worstDecay.changePercent <= -20
          ? "high"
          : "medium";

    return {
      type: "competency_decay",
      severity,
      message: `${decays.length} topic(s) with >${this.config.competencyDecayThreshold}% score drop. Worst: ${worstDecay.subject}/${worstDecay.topicId} (${worstDecay.changePercent.toFixed(1)}% drop)`,
      value: Math.abs(worstDecay.changePercent),
      threshold: this.config.competencyDecayThreshold,
    };
  }

  private checkEaseHell(data: StudentActivityData): RiskFactor | null {
    if (!data.flashcardEaseHell) return null;

    return {
      type: "ease_hell",
      severity: "high",
      message: "Flashcard ease factor indicates ease-hell (interval >30 days, ease <1.3)",
      value: 1,
      threshold: 1,
    };
  }

  private checkExamGap(data: StudentActivityData): RiskFactor | null {
    if (data.examPracticeGap <= this.config.examGapDays) return null;

    const severity =
      data.examPracticeGap > 30 ? "critical" : data.examPracticeGap > 21 ? "high" : "medium";
    return {
      type: "exam_gap",
      severity,
      message: `No past paper practice for ${data.examPracticeGap} days`,
      value: data.examPracticeGap,
      threshold: this.config.examGapDays,
    };
  }

  private checkDurationDrop(data: StudentActivityData): RiskFactor | null {
    if (data.prevAvgSessionDuration === 0) return null;
    const dropPercent =
      ((data.prevAvgSessionDuration - data.avgSessionDuration) / data.prevAvgSessionDuration) * 100;
    if (dropPercent <= this.config.durationDropThreshold) return null;

    const severity = dropPercent > 50 ? "critical" : dropPercent > 40 ? "high" : "medium";
    return {
      type: "duration_drop",
      severity,
      message: `Average session duration dropped ${dropPercent.toFixed(1)}% (was ${Math.round(data.prevAvgSessionDuration)}min, now ${Math.round(data.avgSessionDuration)}min)`,
      value: dropPercent,
      threshold: this.config.durationDropThreshold,
    };
  }

  private checkEngagementDrop(data: StudentActivityData): RiskFactor | null {
    // Engagement drop: fewer active days or quizzes compared to previous period
    if (data.activeDaysLast30 === 0) return null;

    // Calculate expected engagement based on historical patterns
    const expectedQuizzes = Math.max(5, data.totalQuizzesLast30 * 0.7); // at least 70% of previous
    if (data.totalQuizzesLast30 < expectedQuizzes) {
      const dropPercent = ((expectedQuizzes - data.totalQuizzesLast30) / expectedQuizzes) * 100;
      if (dropPercent > this.config.engagementDropThreshold) {
        const severity = dropPercent > 50 ? "critical" : dropPercent > 35 ? "high" : "medium";
        return {
          type: "engagement_drop",
          severity,
          message: `Quiz engagement dropped ${dropPercent.toFixed(1)}% vs expected (${data.totalQuizzesLast30} vs ${Math.round(expectedQuizzes)} quizzes in 30 days)`,
          value: dropPercent,
          threshold: this.config.engagementDropThreshold,
        };
      }
    }
    return null;
  }

  private severityWeight(severity: RiskFactor["severity"]): number {
    switch (severity) {
      case "critical":
        return 3;
      case "high":
        return 2;
      case "medium":
        return 1;
      case "low":
        return 0.5;
    }
  }

  private generateRecommendation(factors: RiskFactor[]): string {
    if (factors.length === 0) return "Keep up the great work!";

    const criticalFactors = factors.filter((f) => f.severity === "critical");
    const highFactors = factors.filter((f) => f.severity === "high");

    if (criticalFactors.length > 0) {
      return `Urgent: ${criticalFactors.map((f) => f.message).join("; ")}. Immediate action recommended.`;
    }
    if (highFactors.length > 0) {
      return `Attention needed: ${highFactors.map((f) => f.message).join("; ")}. Consider increasing study frequency.`;
    }
    return `Monitor: ${factors.map((f) => f.message).join("; ")}. Small adjustments can prevent escalation.`;
  }
}

// Data access functions
export async function fetchStudentActivityData(
  db: DataAccess,
  userId: string,
  days: number = 30,
): Promise<StudentActivityData | null> {
  try {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    // Fetch quiz attempts
    const attempts = await db.quizAttempts
      .where("userId")
      .equals(userId)
      .filter((a: { completedAt: number }) => a.completedAt >= since)
      .toArray();

    // Fetch flashcard reviews
    const reviews = await db.flashcards.where("userId").equals(userId).toArray();

    // Fetch competencies
    const competencies = await db.competencies.where("userId").equals(userId).toArray();

    // Fetch exam sessions
    const examSessions = await db.examSessions
      .where("userId")
      .equals(userId)
      .filter((e: { startedAt: number }) => e.startedAt >= since)
      .toArray();

    // Calculate quiz streak
    const quizDates = attempts
      .map((a: { completedAt: number }) => new Date(a.completedAt).toISOString().split("T")[0])
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
      .toSorted((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());

    let quizStreak = 0;
    let lastQuizAt = 0;
    if (quizDates.length > 0) {
      lastQuizAt = new Date(quizDates[0]).getTime();
      const today = new Date().toISOString().split("T")[0];
      let checkDate = quizDates[0] === today ? 1 : 0;

      for (let i = 0; i < quizDates.length - 1; i++) {
        const current = new Date(quizDates[i]);
        const prev = new Date(quizDates[i + 1]);
        const diff = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          quizStreak++;
        } else {
          break;
        }
      }
      quizStreak++;
    }

    // Calculate competency trends
    const competencyTrends = competencies.map(
      (c: {
        topicId: string;
        subjectId: string;
        id?: number;
        score: number;
        attempts: number;
        lastAssessed: number;
      }) => {
        const prev = competencies.find(
          (p: { topicId: string; subjectId: string; id?: number }) =>
            p.topicId === c.topicId && p.subjectId === c.subjectId && p.id !== c.id,
        );
        const prevScore = prev ? prev.score : c.score;
        const changePercent = prevScore > 0 ? ((c.score - prevScore) / prevScore) * 100 : 0;
        return {
          topicId: c.topicId,
          subject: c.subjectId,
          currentScore: c.score,
          prevScore,
          changePercent,
          attempts: c.attempts,
          lastAssessed: c.lastAssessed,
        };
      },
    );

    // Check flashcard ease-hell
    const easeHell = reviews.some((r) => r.interval > 30 && r.easeFactor < 1.3);

    // Exam practice gap
    const examPracticeGap =
      examSessions.length > 0
        ? Math.floor(
            (Date.now() -
              Math.max(...examSessions.map((e: { startedAt: number }) => e.startedAt))) /
              (1000 * 60 * 60 * 24),
          )
        : 999;

    // Session durations
    const durations = attempts
      .map((a: { duration: number }) => a.duration)
      .filter((d: number) => d > 0);
    const avgSessionDuration =
      durations.length > 0
        ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
        : 0;
    const prevDurations = attempts
      .filter(
        (a: { completedAt: number; duration: number }) =>
          a.completedAt < Date.now() - 30 * 24 * 60 * 60 * 1000,
      )
      .map((a: { duration: number }) => a.duration)
      .filter((d: number) => d > 0);
    const prevAvgSessionDuration =
      prevDurations.length > 0
        ? prevDurations.reduce((a: number, b: number) => a + b, 0) / prevDurations.length
        : 0;

    // Engagement metrics
    const activeDays = new Set(
      attempts.map(
        (a: { completedAt: number }) => new Date(a.completedAt).toISOString().split("T")[0],
      ),
    ).size;
    const totalQuizzesLast30 = attempts.length;

    return {
      quizStreak: quizStreak,
      lastQuizAt: lastQuizAt,
      competencyTrends,
      flashcardEaseHell: easeHell,
      examPracticeGap: examPracticeGap,
      avgSessionDuration,
      prevAvgSessionDuration,
      activeDaysLast30: activeDays,
      totalQuizzesLast30: totalQuizzesLast30,
    };
  } catch (e) {
    logError("fetchStudentActivityData", e);
    return null;
  }
}
export const riskModel = new RiskModel();
