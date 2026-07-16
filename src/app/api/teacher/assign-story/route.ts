import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { isTeacher } from "@/lib/server/auth";
import { COLLECTIONS, createDocument } from "@/lib/db/client";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "TeacherAssignStory",
  validate: (body) => {
    if (!body.storyIds || !Array.isArray(body.storyIds) || body.storyIds.length === 0)
      return "storyIds required";
    return null;
  },
  execute: async ({ userId, body }) => {
    if (!userId || !isTeacher(userId)) throw new HttpError(403, "Teacher access required");
    const { storyIds, dueDate } = body as { storyIds: string[]; dueDate?: string };

    await createDocument(COLLECTIONS.TEACHER_ASSIGNMENTS, {
      teacherId: userId,
      storyIds: JSON.stringify(storyIds),
      assignmentType: "story",
      status: "pending",
      createdAt: new Date().toISOString(),
      ...(dueDate ? { dueDate } : {}),
    });
    return { success: true, storyIds };
  },
});
