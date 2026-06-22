import { Query } from "appwrite";
import { Users } from "node-appwrite";
import { serverClient } from "@/lib/appwrite.server";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

export interface PlatformAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalQuestions: number;
  totalStudySessions: number;
  totalExamSessions: number;
  monthlySessions: number;
  completionRate: number;
  overallAccuracy: number;
  subjectPopularity: Array<{
    subject: string;
    code: string;
    sessions: number;
  }>;
}

export class PlatformAnalyticsService {
  async fetchAnalytics(): Promise<PlatformAnalytics> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      usersResult,
      questions,
      studySessions,
      examSessions,
      recentStudy,
      recentExam,
      monthlyStudy,
      subjects,
    ] = await Promise.all([
      new Users(serverClient).list([Query.limit(1)]).catch(() => ({ total: 0 })),
      listDocuments<Record<string, unknown>>(COLLECTIONS.QUESTIONS, [Query.limit(1)]),
      listDocuments<Record<string, unknown>>(COLLECTIONS.STUDY_SESSIONS, [Query.limit(1)]),
      listDocuments<Record<string, unknown>>(COLLECTIONS.EXAM_SESSIONS, [Query.limit(1)]),
      listDocuments<Record<string, unknown>>(COLLECTIONS.STUDY_SESSIONS, [
        Query.greaterThan("startedAt", sevenDaysAgo),
      ]),
      listDocuments<Record<string, unknown>>(COLLECTIONS.EXAM_SESSIONS, [
        Query.greaterThan("startedAt", sevenDaysAgo),
      ]),
      listDocuments<Record<string, unknown>>(COLLECTIONS.STUDY_SESSIONS, [
        Query.greaterThan("startedAt", thirtyDaysAgo),
      ]),
      listDocuments<Record<string, unknown>>(COLLECTIONS.SUBJECTS),
    ]);

    const totalUsers = usersResult.total;
    const totalQuestions = questions.length;
    const totalStudySessions = studySessions.length;
    const totalExamSessions = examSessions.length;
    const activeUsers = Math.max(recentStudy.length, recentExam.length);
    const monthlySessions = monthlyStudy.length;

    const subjectPopularity = subjects
      .map((s) => ({
        subject: s.name as string,
        code: s.code as string,
      }))
      .slice(0, 10);

    const [subjectSessionCounts, recentSessionDocs] = await Promise.all([
      Promise.all(
        subjectPopularity.map(async (s) => {
          const count = await listDocuments<Record<string, unknown>>(COLLECTIONS.STUDY_SESSIONS, [
            Query.equal("subjectId", s.code),
            Query.limit(100),
          ]);
          return { ...s, sessions: count.length };
        }),
      ),
      listDocuments<Record<string, unknown>>(COLLECTIONS.STUDY_SESSIONS, [
        Query.greaterThan("startedAt", thirtyDaysAgo),
        Query.limit(500),
      ]),
    ]);

    const completedSessions = recentSessionDocs.filter((s) => s.endedAt || s.startedAt);
    const completionRate =
      recentSessionDocs.length > 0
        ? Math.round((completedSessions.length / recentSessionDocs.length) * 100)
        : 0;

    const totalCorrect = completedSessions.reduce(
      (sum, s) => sum + ((s.correctCount as number) || 0),
      0,
    );
    const totalAnswered = completedSessions.reduce(
      (sum, s) => sum + ((s.questionsAnswered as number) || 0),
      0,
    );
    const overallAccuracy =
      totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    return {
      totalUsers,
      activeUsers,
      totalQuestions,
      totalStudySessions,
      totalExamSessions,
      monthlySessions,
      completionRate,
      overallAccuracy,
      subjectPopularity: subjectSessionCounts.sort((a, b) => b.sessions - a.sessions),
    };
  }
}
