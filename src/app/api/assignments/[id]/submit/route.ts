import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { COLLECTIONS, createDocument, listDocuments } from "@/lib/db/client";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "AssignmentSubmit",
  validate: (body) => {
    if (body.score == null || body.maxScore == null) return "score and maxScore required";
    return null;
  },
  execute: async ({ userId, body, params }) => {
    const assignmentId = params?.id as string;
    const { score, maxScore, totalQuestions, correctCount } = body as {
      score: number;
      maxScore: number;
      totalQuestions?: number;
      correctCount?: number;
    };

    const existing = await listDocuments(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, [
      Query.equal("assignmentId", assignmentId),
      Query.equal("studentId", userId as string),
    ]);

    if (existing.length > 0) {
      const { updateDocument } = await import("@/lib/db/client");
      await updateDocument(
        COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
        (existing[0] as Record<string, unknown>).$id as string,
        {
          score,
          maxScore,
          totalQuestions: totalQuestions ?? 0,
          correctCount: correctCount ?? 0,
          completedAt: new Date().toISOString(),
        },
      );
      return { success: true, updated: true };
    }

    await createDocument(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, {
      assignmentId,
      studentId: userId,
      score,
      maxScore,
      totalQuestions: totalQuestions ?? 0,
      correctCount: correctCount ?? 0,
      completedAt: new Date().toISOString(),
    });
    return { success: true, updated: false };
  },
});
