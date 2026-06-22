import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { getAuthenticatedUserName } from "@/lib/server/auth";
import {
  endLiveSession,
  getLiveSession,
  getParticipants,
  joinSession,
  leaveSession,
  updateActivity,
} from "@/lib/study-groups/live-session-service";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "LiveSession",
  execute: async ({ params }) => {
    const sessionId = params?.sessionId as string;
    const session = await getLiveSession(sessionId);
    if (!session) throw new HttpError(404, "Session not found");
    const participants = await getParticipants(sessionId);
    return { session, participants };
  },
});

export const PATCH = createRouteHandler<{
  action: "end" | "join" | "leave" | "activity";
  activity?: string;
}>({
  auth: "required",
  errorLabel: "LiveSession",
  execute: async ({ params, body, userId }) => {
    const sessionId = params?.sessionId as string;
    const { action, activity } = body;

    if (action === "end") {
      const ok = await endLiveSession(sessionId);
      if (!ok) throw new HttpError(500, "Failed to end session");
      return { success: true };
    }

    if (!userId) throw new HttpError(401, "Not authenticated");

    if (action === "join") {
      const userName = await getAuthenticatedUserName();
      const ok = await joinSession(sessionId, userId, userName ?? undefined);
      if (!ok) throw new HttpError(500, "Failed to join session");
      return { success: true };
    }

    if (action === "leave") {
      const ok = await leaveSession(sessionId, userId);
      if (!ok) throw new HttpError(500, "Failed to leave session");
      return { success: true };
    }

    if (action === "activity") {
      const ok = await updateActivity(sessionId, userId, activity ?? "");
      if (!ok) throw new HttpError(500, "Failed to update activity");
      return { success: true };
    }

    throw new HttpError(400, "Invalid action");
  },
});
