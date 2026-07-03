import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import {
  COLLECTIONS,
  createDocument,
  deleteDocument,
  listDocuments,
  updateDocument,
} from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "SyncPush",
  parseBody: async (req) => {
    const body: {
      table: string;
      recordId: string;
      operation: "create" | "update" | "delete";
      data: string;
      createdAt: number;
    } = await req.json();
    return body;
  },
  validate: (body) => {
    if (!body.table || !body.recordId) return "table and recordId are required";
    return null;
  },
  execute: async ({ body, userId }) => {
    const now = new Date().toISOString();

    const existing = await listDocuments<Record<string, unknown>>(COLLECTIONS.SYNC_ENTRIES, [
      Query.equal("table", body.table),
      Query.equal("recordId", body.recordId),
      Query.equal("userId", userId!),
      Query.limit(1),
    ]);

    if (body.operation === "delete") {
      if (existing.length > 0) {
        try {
          await deleteDocument(COLLECTIONS.SYNC_ENTRIES, existing[0].$id as string);
        } catch (err) {
          logError("SyncPush.Delete", err);
          throw err;
        }
      }
      return { accepted: true };
    }

    const doc = {
      table: body.table,
      recordId: body.recordId,
      operation: body.operation,
      data: body.data,
      userId: userId!,
      updatedAt: now,
    };

    if (existing.length > 0) {
      await updateDocument(COLLECTIONS.SYNC_ENTRIES, existing[0].$id as string, doc);
    } else {
      await createDocument(COLLECTIONS.SYNC_ENTRIES, doc);
    }

    return { accepted: true };
  },
});
