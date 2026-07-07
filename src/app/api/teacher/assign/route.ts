import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { isTeacher } from "@/lib/server/auth";
import { COLLECTIONS, createDocument } from "@/lib/db/client";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "TeacherAssign",
  validate: (body) => {
    if (!body.topics || !Array.isArray(body.topics) || body.topics.length === 0)
      return "topics required";
    return null;
  },
  execute: async ({ userId, body }) => {
    if (!userId || !isTeacher(userId)) throw new HttpError(403, "Teacher access required");
    const { topics, dueDate } = body as { topics: string[]; dueDate?: string };

    await createDocument(COLLECTIONS.TEACHER_ASSIGNMENTS, {
      teacherId: userId,
      topicIds: JSON.stringify(topics),
      status: "pending",
      createdAt: new Date().toISOString(),
      ...(dueDate ? { dueDate } : {}),
    });
    return { success: true, topics };
  },
});
