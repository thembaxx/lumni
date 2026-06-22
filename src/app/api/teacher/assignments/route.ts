import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

interface SubmissionSummary {
  studentId: string;
  score: number;
  maxScore: number;
  totalQuestions: number;
  correctCount: number;
  completedAt: string;
  teacherComment?: string;
}

interface AssignmentWithSubmissions {
  id: string;
  topicIds: string;
  status: string;
  createdAt: string;
  dueDate?: string;
  submissions: SubmissionSummary[];
}

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "TeacherAssignments",
  execute: async ({ userId }) => {
    const assignments = await listDocuments(COLLECTIONS.TEACHER_ASSIGNMENTS, [
      Query.equal("teacherId", userId as string),
      Query.orderDesc("createdAt"),
    ]);

    if (assignments.length === 0) {
      return { assignments: [] };
    }

    const subsResults = await Promise.all(
      assignments.map(async (a) => {
        const doc = a as Record<string, unknown>;
        const subs = await listDocuments(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, [
          Query.equal("assignmentId", doc.$id as string),
        ]);
        return {
          doc,
          subs: subs.map((s) => {
            const sd = s as Record<string, unknown>;
            return {
              studentId: sd.studentId as string,
              score: (sd.score as number) ?? 0,
              maxScore: (sd.maxScore as number) ?? 0,
              totalQuestions: (sd.totalQuestions as number) ?? 0,
              correctCount: (sd.correctCount as number) ?? 0,
              completedAt: (sd.completedAt as string) ?? "",
              teacherComment: sd.teacherComment as string | undefined,
            };
          }),
        };
      }),
    );

    const grouped: AssignmentWithSubmissions[] = subsResults.map(({ doc, subs }) => ({
      id: doc.$id as string,
      topicIds: (doc.topicIds as string) ?? "[]",
      status: (doc.status as string) ?? "pending",
      createdAt: (doc.createdAt as string) ?? "",
      dueDate: doc.dueDate as string | undefined,
      submissions: subs,
    }));

    return { assignments: grouped };
  },
});
