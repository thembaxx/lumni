import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";

interface CreateSharedQuizBody {
  subject: string;
  topic?: string;
}

interface SharedQuizSession {
  channelName: string;
  inviteCode: string;
  groupId: string;
  subject: string;
  topic?: string;
  createdBy: string;
  createdAt: string;
}

const activeSessions = new Map<string, SharedQuizSession>();

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "SharedQuiz",
  validate: (body: CreateSharedQuizBody) => {
    if (!body.subject || typeof body.subject !== "string") return "subject is required";
    if (body.topic && typeof body.topic !== "string") return "topic must be a string";
    return null;
  },
  execute: async ({ userId, body, params }) => {
    const groupId = params?.groupId as string;
    if (!groupId) throw new HttpError(400, "groupId is required");

    const { subject, topic } = body as CreateSharedQuizBody;
    const channelName = `shared-quiz-${groupId}-${Date.now()}`;
    const inviteCode = Array.from(
      { length: 8 },
      () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)],
    ).join("");

    const session: SharedQuizSession = {
      channelName,
      inviteCode,
      groupId,
      subject,
      topic,
      createdBy: userId as string,
      createdAt: new Date().toISOString(),
    };

    activeSessions.set(inviteCode, session);

    return { channelName, inviteCode, subject, topic };
  },
});

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "SharedQuiz",
  execute: async ({ params }) => {
    const groupId = params?.groupId as string;
    if (!groupId) throw new HttpError(400, "groupId is required");

    const sessions = Array.from(activeSessions.values()).filter((s) => s.groupId === groupId);

    return { sessions };
  },
});
