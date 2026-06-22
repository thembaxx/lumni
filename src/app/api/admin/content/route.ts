import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { COLLECTIONS, listDocuments, updateDocument } from "@/lib/db/client";

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "Content",
  execute: async () => {
    const flags = await listDocuments<Record<string, unknown>>(COLLECTIONS.QUESTION_FLAGS, [
      Query.orderDesc("createdAt"),
      Query.limit(100),
    ]);
    return { flags };
  },
});

export const PATCH = createRouteHandler({
  auth: "admin",
  errorLabel: "Content",
  validate: (body) => {
    if (!body.flagId || !body.status) return "flagId and status are required";
    const validStatuses = ["pending", "resolved", "dismissed"];
    if (!validStatuses.includes(body.status as string)) {
      return `status must be one of: ${validStatuses.join(", ")}`;
    }
    return null;
  },
  execute: async ({ body }) => {
    const { flagId, status } = body as { flagId: string; status: string };

    await updateDocument(COLLECTIONS.QUESTION_FLAGS, flagId, {
      status,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});
