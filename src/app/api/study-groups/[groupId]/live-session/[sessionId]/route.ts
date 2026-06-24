import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { endLiveSession, getLiveSession } from "@/lib/study-groups/live-session-service";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "LiveSession",
  execute: async ({ params }) => {
    const sessionId = params?.sessionId as string;
    const session = await getLiveSession(sessionId);
    if (!session) throw new HttpError(404, "Session not found");
    return { session };
  },
});

export const PATCH = createRouteHandler<{ action: "end" }>({
  auth: "required",
  errorLabel: "LiveSession",
  execute: async ({ params, body }) => {
    const sessionId = params?.sessionId as string;
    const { action } = body;

    if (action === "end") {
      const ok = await endLiveSession(sessionId);
      if (!ok) throw new HttpError(500, "Failed to end session");
      return { success: true };
    }

    throw new HttpError(400, "Invalid action");
  },
});
