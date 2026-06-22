import { createRouteHandler } from "@/lib/api/create-route-handler";
import { getSessionsByTeacher } from "@/lib/study-groups/live-session-service";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "TeacherLiveSessions",
  execute: async ({ userId }) => {
    const sessions = await getSessionsByTeacher(userId as string);
    return { sessions };
  },
});
