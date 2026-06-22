import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";

export const runtime = "nodejs";

interface CreateSessionBody {
  paperId: string;
  answers?: Record<string, unknown>;
  flags?: string[];
  timeRemaining?: number;
  startedAt?: string;
}

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "List Sessions",
  execute: async ({ userId }) => {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.EXAM_SESSIONS,
      [Query.equal("userId", userId as string)],
    );

    const sessions = response.documents.map((doc) => ({
      id: doc.$id,
      examPaperId: doc.examPaperId,
      answers: doc.answers ? JSON.parse(doc.answers as string) : {},
      flags: doc.flags ? JSON.parse(doc.flags as string) : [],
      timeRemaining: doc.timeRemaining,
      completed: doc.completed,
      startedAt: doc.startedAt,
      lastSavedAt: doc.lastSavedAt,
    }));

    return { sessions };
  },
});

export const POST = createRouteHandler<CreateSessionBody>({
  auth: "required",
  errorLabel: "Save Session",
  parseBody: async (req) => {
    const body = await req.json();
    return body as CreateSessionBody;
  },
  validate: (body) => {
    if (!body.paperId) return "paperId is required";
    return null;
  },
  execute: async ({ body, userId }) => {
    await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.EXAM_SESSIONS, "unique()", {
      userId,
      examPaperId: body.paperId,
      answers: JSON.stringify(body.answers || {}),
      flags: JSON.stringify(body.flags || []),
      timeRemaining: body.timeRemaining || 0,
      completed: (body.timeRemaining ?? 0) <= 0,
      startedAt: body.startedAt || new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});
