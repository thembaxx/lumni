import { Query, Users } from "node-appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { serverClient } from "@/lib/appwrite.server";
import { COLLECTIONS, getDocument, listDocuments } from "@/lib/db/client";

interface GradeEntry {
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
}

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "AssignmentGrades",
  execute: async ({ userId, params }) => {
    const assignmentId = params?.id;
    if (!assignmentId) {
      return { error: "Assignment ID required" };
    }

    const assignment = await getDocument<Record<string, unknown>>(
      COLLECTIONS.TEACHER_ASSIGNMENTS,
      assignmentId,
    );

    if (!assignment) {
      return { error: "Assignment not found" };
    }

    if ((assignment.teacherId as string) !== userId) {
      return { error: "Not authorized to view this assignment's grades" };
    }

    const submissions = await listDocuments<Record<string, unknown>>(
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      [Query.equal("assignmentId", assignmentId)],
    );

    if (submissions.length === 0) {
      return {
        assignment: {
          id: assignmentId,
          topicIds: assignment.topicIds,
          status: assignment.status,
          dueDate: assignment.dueDate,
        },
        grades: [],
        stats: {
          averagePercentage: 0,
          highestPercentage: 0,
          lowestPercentage: 0,
          submissionCount: 0,
          totalStudents: 0,
        },
      };
    }

    const studentIds = [...new Set(submissions.map((s) => s.studentId as string))];
    const usersApi = new Users(serverClient);

    const nameMap = new Map<string, string>();
    await Promise.all(
      studentIds.map(async (sid) => {
        try {
          const u = await usersApi.get(sid);
          nameMap.set(sid, u.name || "Unknown");
        } catch {
          nameMap.set(sid, "Unknown");
        }
      }),
    );

    const grades: GradeEntry[] = submissions.map((s) => {
      const maxScore = (s.maxScore as number) || 1;
      return {
        studentId: s.studentId as string,
        studentName: nameMap.get(s.studentId as string) || "Unknown",
        score: (s.score as number) || 0,
        maxScore,
        percentage: Math.round(((s.score as number) || 0) / maxScore * 100),
        completedAt: (s.completedAt as string) || "",
      };
    });

    const percentages = grades.map((g) => g.percentage);
    const sum = percentages.reduce((a, b) => a + b, 0);
    const average = percentages.length > 0 ? Math.round(sum / percentages.length) : 0;

    return {
      assignment: {
        id: assignmentId,
        topicIds: assignment.topicIds,
        status: assignment.status,
        dueDate: assignment.dueDate,
      },
      grades,
      stats: {
        averagePercentage: average,
        highestPercentage: percentages.length > 0 ? Math.max(...percentages) : 0,
        lowestPercentage: percentages.length > 0 ? Math.min(...percentages) : 0,
        submissionCount: submissions.length,
        totalStudents: studentIds.length,
      },
    };
  },
});
