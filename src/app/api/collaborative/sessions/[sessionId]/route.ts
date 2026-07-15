import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { collaborativeSessionService } from "@/lib/collaborative/service";
import { createCollaborativeToken } from "@/lib/collaborative/ably";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "CollaborativeSessionGet",
  useRateLimit: true,
  execute: async ({ params, userId, userName }) => {
    const sessionId = params.sessionId;
    if (!sessionId) throw new HttpError(400, "Session ID required");

    const session = await collaborativeSessionService.getSession(sessionId);
    if (!session) throw new HttpError(404, "Session not found");

    // Check if user is part of the group or is host
    if (session.hostId !== userId) {
      // In a real app, check group membership
      // For now, allow if they have the link
    }

    const ablyToken = await createCollaborativeToken(
      userId!,
      sessionId,
      session.hostId === userId ? "host" : "participant"
    );

    return {
      session,
      ablyToken,
      yjsDocId: `whiteboard-${sessionId}`,
      webrtcConfig: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
        maxParticipants: session.maxParticipants,
      },
    };
  },
});

export const PATCH = createRouteHandler({
  auth: "required",
  errorLabel: "CollaborativeSessionUpdate",
  useRateLimit: true,
  parseBody: async (req) => {
    const body = await req.json();
    return body;
  },
  validate: (body) => {
    if (!body.action) return "Action required";
    if (!["start", "end", "join", "leave"].includes(body.action)) {
      return "Invalid action";
    }
    return null;
  },
  execute: async ({ body, params, userId, userName }) => {
    const sessionId = params.sessionId;
    if (!sessionId) throw new HttpError(400, "Session ID required");

    const session = await collaborativeSessionService.getSession(sessionId);
    if (!session) throw new HttpError(404, "Session not found");

    switch (body.action) {
      case "start":
        if (session.hostId !== userId) throw new HttpError(403, "Only host can start session");
        if (session.status !== "waiting") throw new HttpError(400, "Session already started");
        await collaborativeSessionService.startSession(sessionId);
        return { status: "active", startedAt: Date.now() };

      case "end":
        if (session.hostId !== userId) throw new HttpError(403, "Only host can end session");
        await collaborativeSessionService.endSession(sessionId);
        return { status: "ended", endedAt: Date.now() };

      case "join":
        if (session.status === "ended") throw new HttpError(400, "Session has ended");
        if (session.currentParticipants >= session.maxParticipants) {
          throw new HttpError(400, "Session is full");
        }
        const participant = await collaborativeSessionService.joinSession(sessionId, userId!, userName || "Unknown");
        return { participant, session };

      case "leave":
        await collaborativeSessionService.leaveSession(sessionId, userId!);
        return { left: true };

      default:
        throw new HttpError(400, "Invalid action");
    }
  },
});