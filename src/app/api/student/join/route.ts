import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { COLLECTIONS, createDocument, listDocuments, updateDocument } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";

export const POST = createRouteHandler({
  auth: "required",
  useRateLimit: true,
  errorLabel: "StudentJoin",
  validate: (body) => {
    if (!body.code || typeof body.code !== "string") return "code required";
    return null;
  },
  execute: async ({ userId, body }) => {
    const code = (body.code as string).toUpperCase().trim();
    if (code.length !== 6) {
      return { error: "Invalid join code format" };
    }

    const docs = await listDocuments(COLLECTIONS.CLASSROOM_CODES, [
      Query.equal("code", code),
      Query.limit(1),
    ]);

    if (docs.length === 0) {
      return { error: "Invalid or expired join code" };
    }

    const doc = docs[0] as Record<string, unknown>;

    if (doc.revoked as boolean) {
      return { error: "This join code has been revoked" };
    }

    if ((doc.expiresAt as number) < Date.now()) {
      return { error: "This join code has expired" };
    }

    if (doc.maxUses !== null && (doc.useCount as number) >= (doc.maxUses as number)) {
      return { error: "This join code has reached its maximum number of uses" };
    }

    const teacherId = doc.teacherId as string;

    if (userId === teacherId) {
      return { error: "Cannot join your own classroom" };
    }

    const existingLinks = await listDocuments(COLLECTIONS.TEACHER_STUDENTS, [
      Query.equal("teacherId", teacherId),
      Query.equal("studentId", userId as string),
      Query.limit(1),
    ]);

    if (existingLinks.length > 0) {
      return { error: "Already linked to this teacher" };
    }

    try {
      await createDocument(COLLECTIONS.TEACHER_STUDENTS, {
        teacherId,
        studentId: userId as string,
        subjectId: doc.subjectId || null,
      });

      await updateDocument(
        COLLECTIONS.CLASSROOM_CODES,
        (doc.$id as string),
        { useCount: (doc.useCount as number) + 1 },
      );
    } catch (e) {
      logError("StudentJoinLink", e);
      return { error: "Failed to join classroom" };
    }

    return {
      success: true,
      teacherId,
      subjectId: doc.subjectId || null,
    };
  },
});
