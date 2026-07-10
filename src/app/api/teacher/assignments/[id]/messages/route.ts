import { Query } from "appwrite";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { isTeacher } from "@/lib/server/auth";
import { logError } from "@/lib/shared/logger";

const VALID_ROLES = new Set(["teacher", "student", "parent"]);

export const GET = createRouteHandler({
  auth: "required",
  execute: async ({ params, userId }) => {
    if (!isTeacher(userId!)) throw new HttpError(403, "Teacher access required");

    const id = params?.id;
    if (!id || typeof id !== "string") throw new HttpError(400, "Invalid assignment ID");

    try {
      const result = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.ASSIGNMENT_MESSAGES,
        [Query.equal("assignmentId", id), Query.orderAsc("createdAt")],
      );
      return { messages: result.documents };
    } catch (e) {
      logError("TeacherMessagesGet", e);
      throw new HttpError(500, "Failed to fetch messages");
    }
  },
  errorLabel: "TeacherMessagesGet",
});

export const POST = createRouteHandler({
  auth: "required",
  execute: async ({ body, params, userId }) => {
    if (!isTeacher(userId!)) throw new HttpError(403, "Teacher access required");

    const id = params?.id;
    if (!id || typeof id !== "string") throw new HttpError(400, "Invalid assignment ID");

    const { content, senderRole } = body as { content?: string; senderRole?: string };

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      throw new HttpError(400, "Message content is required");
    }

    if (content.length > 5000) {
      throw new HttpError(400, "Message too long (max 5000 characters)");
    }

    const role = VALID_ROLES.has(senderRole || "") ? senderRole : "teacher";

    const msg = {
      assignmentId: id,
      senderId: userId,
      senderRole: role,
      content: content.trim(),
      createdAt: Date.now(),
    };

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.ASSIGNMENT_MESSAGES,
        "unique()",
        msg,
      );
    } catch (e) {
      logError("TeacherMessagesPost", e);
      throw new HttpError(500, "Failed to save message");
    }

    return msg;
  },
  errorLabel: "TeacherMessagesPost",
});
