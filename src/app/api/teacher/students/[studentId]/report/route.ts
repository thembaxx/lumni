import { Query } from "appwrite";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { isTeacher } from "@/lib/server/auth";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "StudentReport",
  execute: async ({
    userId,
    params,
  }: {
    userId: string | null;
    params?: Record<string, string>;
  }) => {
    if (!userId || !isTeacher(userId)) throw new HttpError(403, "Teacher access required");
    const studentId = params?.studentId;
    if (!studentId) return { competencies: [], quizAttempts: [], subjects: [] };

    try {
      const teacherLinks = await listDocuments(COLLECTIONS.TEACHER_STUDENTS, [
        Query.equal("teacherId", userId),
        Query.equal("studentId", studentId),
      ]);
      const parentLinks = await listDocuments(COLLECTIONS.PARENT_STUDENTS, [
        Query.equal("parentId", userId),
        Query.equal("studentId", studentId),
      ]);
      if (teacherLinks.length === 0 && parentLinks.length === 0) {
        return {
          competencies: [],
          quizAttempts: [],
          subjects: [],
          error: "Not authorized to view this student's report",
        };
      }
      const competencies = (await listDocuments(COLLECTIONS.COMPETENCIES, [
        Query.equal("userId", studentId),
      ])) as Record<string, unknown>[];

      const compData = competencies.map((c) => ({
        subjectId: (c.subjectId as string) ?? "",
        topicId: (c.topicId as string) ?? "",
        level: (c.level as string) ?? "novice",
        score: (c.proficiency as number) ?? 0,
      }));

      const sessions = (await listDocuments(COLLECTIONS.STUDY_SESSIONS, [
        Query.equal("userId", studentId),
        Query.limit(50),
        Query.orderDesc("endedAt"),
      ])) as Record<string, unknown>[];

      const attemptData: {
        subject: string;
        score: number;
        total: number;
        date: number;
      }[] = [];
      for (const s of sessions) {
        const correctCount = (s.correctCount as number) ?? 0;
        const questionsAnswered = (s.questionsAnswered as number) ?? 0;
        if (questionsAnswered === 0) continue;
        attemptData.push({
          subject: (s.subjectId as string) ?? "Unknown",
          score: correctCount,
          total: questionsAnswered,
          date: new Date(s.endedAt as string).getTime(),
        });
      }

      const subjects = (await listDocuments(COLLECTIONS.SUBJECTS)) as Record<string, unknown>[];
      const subjectNames = subjects.map((s) => ({
        name: (s.name as string) ?? (s.code as string),
      }));

      return {
        competencies: compData,
        quizAttempts: attemptData,
        subjects: subjectNames,
      };
    } catch (e) {
      logError("StudentReportFetch", e);
      return { competencies: [], quizAttempts: [], subjects: [] };
    }
  },
});
