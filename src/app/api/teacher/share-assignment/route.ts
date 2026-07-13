import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { isTeacher } from "@/lib/server/auth";
import { shareAssignment } from "@/lib/share/share-service";

export const POST = createRouteHandler({
  auth: "required",
  validate: (body: { assignmentId?: string; topic?: string }) => {
    if (!body.assignmentId || !body.topic) return "assignmentId and topic required";
    return null;
  },
  execute: async ({
    body,
    userId,
  }: {
    body: {
      assignmentId: string;
      topic: string;
      questionCount?: number;
      dueDate?: string;
    };
    userId: string | null;
  }) => {
    if (!userId || !isTeacher(userId)) throw new HttpError(403, "Teacher access required");
    const result = await shareAssignment(
      body.assignmentId,
      body.topic,
      body.questionCount ?? 10,
      body.dueDate,
      userId ?? undefined,
    );
    return result;
  },
  errorLabel: "ShareAssignment",
});
