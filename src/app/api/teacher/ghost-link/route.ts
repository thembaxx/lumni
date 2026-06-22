import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";

export const POST = createRouteHandler({
  auth: "required",
  execute: async ({ userId }) => {
    const token = crypto.randomUUID();
    const link = {
      token,
      teacherId: userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      revoked: false,
    };
    try {
      await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.GHOST_LINKS, token, link);
    } catch (e) {
      logError("GhostLinkCreate", e);
    }
    return {
      token,
      url: `/ghost/${token}`,
      expiresAt: link.expiresAt,
    };
  },
  errorLabel: "GhostLink",
});

export const DELETE = createRouteHandler({
  auth: "required",
  execute: async ({ body, userId }: { body: { token?: string }; userId: string | null }) => {
    if (!userId) return { success: false, error: "Unauthorized" };
    if (body.token) {
      try {
        const docs = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.GHOST_LINKS, [
          Query.equal("token", body.token),
        ]);
        if (docs.documents.length > 0) {
          const link = docs.documents[0];
          if (link.teacherId !== userId) {
            return { success: false, error: "Not authorized" };
          }
          await databases.deleteDocument(APPWRITE_DATABASE_ID, COLLECTIONS.GHOST_LINKS, link.$id);
        }
      } catch (e) {
        logError("GhostLinkDelete", e);
      }
    }
    return { success: true };
  },
  errorLabel: "GhostLink",
});
