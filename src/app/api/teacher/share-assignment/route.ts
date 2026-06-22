import { createRouteHandler } from "@/lib/api/create-route-handler";
import { shareAssignment } from "@/lib/share/share-service";

export const POST = createRouteHandler({
  auth: "none",
  validate: (body: { assignmentId?: string; topic?: string }) => {
    if (!body.assignmentId || !body.topic) return "assignmentId and topic required";
    return null;
  },
  execute: async ({
    body,
  }: {
    body: {
      assignmentId: string;
      topic: string;
      questionCount?: number;
      dueDate?: string;
    };
  }) => {
    const result = await shareAssignment(
      body.assignmentId,
      body.topic,
      body.questionCount ?? 10,
      body.dueDate,
    );
    return result;
  },
  errorLabel: "ShareAssignment",
});
