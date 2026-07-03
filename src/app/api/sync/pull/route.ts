import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "SyncPull",
  execute: async ({ req, userId }) => {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get("table");
    const since = Number(searchParams.get("since")) || 0;

    if (!table) {
      return { records: [], version: "" };
    }

    const sinceISO = since > 0 ? new Date(since).toISOString() : new Date(0).toISOString();

    const docs = await listDocuments<Record<string, unknown>>(COLLECTIONS.SYNC_ENTRIES, [
      Query.equal("table", table),
      Query.equal("userId", userId!),
      Query.greaterThan("updatedAt", sinceISO),
    ]);

    const records = docs
      .map((doc) => {
        try {
          return JSON.parse(doc.data as string);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return {
      records,
      version: String(Date.now()),
    };
  },
});
