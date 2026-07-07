import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { isTeacher } from "@/lib/server/auth";
import { getSessionsByTeacher } from "@/lib/study-groups/live-session-service";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "TeacherLiveSessions",
  execute: async ({ userId }) => {
    if (!userId || !isTeacher(userId)) throw new HttpError(403, "Teacher access required");
    const sessions = await getSessionsByTeacher(userId as string);
    return { sessions };
  },
});
