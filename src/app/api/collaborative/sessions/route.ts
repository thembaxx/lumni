import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { collaborativeSessionService } from "@/lib/collaborative/session-service";
import { logError } from "@/lib/shared/logger";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "CollaborativeSessions",
  useRateLimit: true,
  parseBody: async (req) => {
    const body = await req.json();
    return body;
  },
  validate: (body) => {
    if (!body.subject) return "Subject is required";
    if (!body.groupId) return "Group ID is required";
    return null;
  },
  execute: async ({ body, userId }) => {
    const { subject, topic, groupId, inviteCode } = body as {
      subject: string;
      topic?: string;
      groupId: string;
      inviteCode?: string;
    };

    // Get user name from auth context
    const { useAuth } = await import("@/lib/auth/auth-context");
    // We'll get user name from the user object in execute context
    const userName = "User"; // TODO: get from auth context

    const session = await collaborativeSessionService.createSession(userId!, userName, groupId, {
      subject,
      topic,
      inviteCode,
    });

    // Get Ably token
    const { createCollaborativeToken } = await import("@/lib/collaborative/ably");
    const ablyToken = await createCollaborativeToken(userId!, session.id, "host");

    // Generate Yjs doc ID
    const yjsDocId = `whiteboard_${session.id}`;

    // WebRTC config
    const webrtcConfig = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
      maxParticipants: session.maxParticipants,
    };

    return {
      session,
      ablyToken,
      yjsDocId,
      webrtcConfig,
    };
  },
});
